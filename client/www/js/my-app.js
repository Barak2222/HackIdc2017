setInterval = function(){
   
}
var myApp = new Framework7({
    animateNavBackIcon:true
});
// Export selectors engine
var $$ = Dom7;
// Add main View
var mainView = myApp.addView('.view-main', {
    // Enable dynamic Navbar
    dynamicNavbar: true,
    // Enable Dom Cache so we can use all inline pages
    domCache: true
});

currentUser = null;
utils = {
    isDifferent: function(arr1, arr2){
        if(arr1.length != arr2.length){
            return true;
        }
        for(var i = 0; i < arr1.length; i++){
            if(arr1[i] != arr2[i]){
                if(arr1[i] == null || arr2[i] == null || arr1[i].length != arr2[i].length){
                    return true
                }
            }
        }
        return false;
    },
    dateFormatter(d){
        return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
    },
    dateFormatHourMinute: function(d){
        d = new Date(d);
        return utils.twoDigitsFormat(d.getHours()) + ":" + utils.twoDigitsFormat(d.getMinutes());
    },
    twoDigitsFormat: function(st){
        return ((st + "").length >= 2) ? st : "0" + st;
    },
    isSameDay: function(d1, d2){
        d1 = new Date(d1);
        d2 = new Date(d2);
        if(d1.getDate() != d2.getDate()){ return false; }
        if(d1.getFullYear() != d2.getFullYear()){ return false; }
        if(d1.getMonth() != d2.getMonth()){ return false; }
        return true;
    },
    isOld(d){
        var yesturday = new Date();
        yesturday.setDate(yesturday.getDate() - 1);
        return (d.getTime() < yesturday.getTime());
    },
    isToday: function(d){
        return utils.isSameDay(d, new Date());
    }
}


var navigation = {
    goBack: function(){
        var l = document.getElementById('form-go-back');
        for(var i = 0; i < 50; i++){
            l.click();
        }
    },
    toIDCTab: function(){
        myApp.showTab('#tab1');
    },
    fromIDCTab: function(){
        myApp.showTab('#tab2');
    },
}



$(document).ready(function(){
    $(".back").on('click', function(){
        ridePage.current = null;
    });
    $('#logoutB').on('click', logout);
    $("#commentForm").on('submit', comments.createCommentHandler);
    $.getJSON( "/www/futureRides", function(data) {
        rides.init(data);
    })
    .fail(function(){
        console.log('error while trying to get data from server');
    });
    $.getJSON( "/www/getCurrentUser", function(data) {
        currentUser = data;
    })
    .fail(function(){
        console.log('error while trying to get data from server');
    });
    newPostSubmit.init();
    notifications.init();
    notifications.runLoop();
    rides.runLoop();
    ridePage.runLoop();
});

newPostSubmit = {
    init: function(){
        $('#newPostForm').on('submit', function(e){
            e.preventDefault();
            var form = $(this);
            var userData = form.serialize();

            $.ajax({
                type: 'POST',
                url: '/www/createRide',
                data: userData,
            }).done(function(dataRecieved){
                if(dataRecieved){
                    navigation.goBack();
                    rides.addOnePost(dataRecieved);
                    form.trigger('reset');
                } else {
                    console.log("there was an error?");
                }
            })
            .fail(function(data){
                console.log("there was an error");
            });
        });
    }
}


var rides = {
    data: null,
    init: function(data){
        rides.data = data;
        for (var i = 0; i < data.length; i++) {
            var $ride = this.createNode(data[i]);
            var $container = $(this.whereToPut(data[i]));
            $container.append($ride);
        }
    },
    runLoop: function(){
        setInterval(function(){
            $.getJSON( "/www/futureRides", function(data) {
                if(rides.data.length != data.length){
                    rides.data = data;
                    rides.emptyTheFeed();
                    rides.init(data);
                }
            })
            .fail(function(){
                console.log('error while trying to get data from server');
            });
        }, 1000);

    },
    emptyTheFeed: function(){
        $(".tabs-swipeable-wrap ul").empty();
    },
    addOnePost: function(obj){
        rides.data.push(obj)
        var $ride = this.createNode(obj);
        var $container = $(this.whereToPut(obj));
        $container.append($ride);
        new Highlighter($ride);
    },
    whereToPut: function(obj){
        var st = "#";
        var today = new Date();
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if(utils.isSameDay(obj.date, today)){
            st+= "today";
        } else if(utils.isSameDay(obj.date, tomorrow)){
            st+= "tomorrow";
        } else {
            st+= "later";
        }
        st+= (obj.type == "toIDC") ? "ToIDC" : "FromIDC";
        return st;
    },
    createNode: function(obj){
        var time = obj.hour[0] + ':' + obj.hour[1];
        var $item = $('<div class="item-title">' + obj.from + " to " + obj.to + '</div>');
        var $row = $('<div class="item-title-row"></div>');
        $row.append($item);
        var leavingOrRequesting = (obj.role == "driver") ? "Leaving " : "Requesting ";
        var $span = $('<span class="timeSpan">' + leavingOrRequesting + time + '</span>');
        var $subtitle = $('<div class="item-subtitle">' + obj.author + '</div>');
        $subtitle.append($span);
        $inner = $('<div class="item-inner"></div>').append($row).append($subtitle);
        var imgType = (obj.role == "driver") ? "driver" : "pedestrian";
        $img = $('<div class="item-media"><img src="img/' + imgType + '.png" width="44" /></div>');
        $a = $('<a href="#ride" class="item-link item-content"></a>');
        $a.append($img).append($inner);
        $li = $('<li class="rideComponent" onClick="ridePage.handler(' + obj.id + ')"></li>');
        $li.append($a);
        return $li;
    },
}



var ridePage = {
    current: null,
    data: null,
    tempIdx: null,
    runLoop: function(){
        setInterval(function(){
            if(!ridePage.current){
                return ;
            }
            $.getJSON("/www/getComments/" + ridePage.current, function(data) {
                if(data.length != ridePage.data.comments.length){
                    ridePage.tempIdx = ridePage.data.comments.length;
                    ridePage.data.comments = data;
                    comments.init(data);
                }
            })
            .fail(function(){
                console.log('error while trying to get data from server');
            });
        }, 1000);
    },
    handler: function(rideID){
        ridePage.current = rideID;
        var data = this.getData(rideID);
    },
    handleNotificationsForCurrentPage: function(){
        $.getJSON( "/www/notifications/notify/" + ridePage.current, function( data ) {
        })
        .fail(function(){
            console.log('error while trying to get data from server');
        })

    },
    getData: function(rideID){
        $.getJSON( "/www/getRide/" + rideID, function( data ) {
            ridePage.data = data;
            ridePage.createPage(data);
        })
        .fail(function(){
            console.log('error while trying to get data from server');
        })
    },
    createPage: function(data){
        $("#ridePageAuthor").text(data.author);
        var role = (data.role == "driver") ? "driver" : "pedestrian";
        document.getElementById('ridePageImg').src = "img/" + role + ".png";
        $("#ridePageFromTo").text("From " + data.from + " to " + data.to);
        var time = data.hour[0] + ":" + data.hour[1] + " - " + utils.dateFormatter(new Date(data.date));
        $("#ridePageTime").text("Time: " + time);
        $("#ridePageNotes").text(data.notes);
        comments.init(data.comments);
    },
}


var comments = {
    createCommentHandler: function(e){
        e.preventDefault();
        comments.addOneComment();
    },
    highlightCallback: function($node){
        new Highlighter($node);
    },
    addOneComment: function(){
        var message = document.getElementById('message').value;
        $.post('/www/CreateNewComment', {message: message , rideID: ridePage.current} , function(data){
            if(data){
                ridePage.data.comments.push(data);
                comments.createCommentComponent(data, comments.highlightCallback);
                document.getElementById('message').value = "";
            }
            else{
                alert("error uploading the comment");
            }
        });
    },
    createCommentCard: function(author, message){
        var st = '<div class="card" id="aaa"><div class="card-content"><div class="card-content-inner">'
            +  '<b>' + author + ':</b> ' + message + '</div></div></div>';
        return $(st);
    },
    createCommentComponent: function(data, callback){
        var name = data.author;
        var $node = comments.createCommentCard(name, data.message);
        $("#commentsSec").append($node);

        if(callback){
            callback($node);
        }
    },
    empty: function(){
        $("#commentsSec").empty();
    },
    incoming: function(arr){
        if(!ridePage.tempIdx){
            return ;
        }
        for(var i = ridePage.tempIdx; i < arr.length; i++){

        }
        ridePage.tempIdx = null;
    },
    init: function(arr){
        if(arr.length != document.getElementById("commentsSec").childNodes.length){
            ridePage.handleNotificationsForCurrentPage();
        }
        comments.empty();
        for (var i = 0; i < arr.length; i++) {
            this.createCommentComponent(arr[i]);
        }
    },
}


var logout = function(){
    $.getJSON( "/www/logout", function( data ) {
        if(data == true || data == "true"){
            window.location.href = "/public/login.html";
        } else {
            console.log('error disconnecting');
        }
    })
    .fail(function(){
        console.log('error while trying to get data from server');
    })
};

function Highlighter($node){
    var i = 1;
    var colors = ["#ffff99", "#ffffa3", "#ffffad", "#ffffb8", "#ffffc2", "#ffffcc", "#ffffd6", "#ffffe0", "#ffffeb", "#fffff5", "#ffffff"];
    $node.css({"background-color": colors[0]});

    var tFunc = function() {
        setTimeout(function(){
            $node.css({"background-color": colors[i]});
            i++;
            if(i < colors.length){
                tFunc();
            }
        }, 150);
    }
    setTimeout(function(){
        tFunc();
    }, 500);
}

function countRealLength(arr){
    var count = 0;
    for (var i = 0; i < arr.length; i++) {
        if(arr[i]){
            count++;
        }
    }
    return count;
}

var notifications = {
    data: {},
    $todayContainer: $('#notifToday'),
    $olderContainer: $('#notifOlder'),
    runLoop: function(){
        setInterval(function(){
            $.getJSON( "/www/notifications", function(data) {
                if(utils.isDifferent(notifications.data.notSeen, data.notSeen)){
                    notifications.data = data;
                    notifications.updateIcon();
                }
            })
            .fail(function(){
                console.log('error while trying to get data from server');
            });
        }, 1000);

        notifications.data.notSeen
    },
    init: function(){
        $.getJSON( "/www/notifications", function(data) {
        notifications.data = data;
        notifications.updateIcon();
        })
        .fail(function(){
            console.log('error while trying to get data from server');
        });
    },
    updateIcon: function(){
        var numNew = countRealLength(notifications.data.notSeen);
        var imgSrc;
        if(numNew > 0){
            $("#numNotifications").text(numNew).show();
            imgSrc = "img/notificationOn.png";
        } else {
            $("#numNotifications").hide();
            imgSrc = "img/notificationOff.png";
        }
        document.getElementById("mainNotiIcon").src = imgSrc;

    },
    notifClicked: function(rideID){
        document.getElementById("notifImg" + rideID).src = "img/notificationOff.png";
    },
    emptyNotificationsPage: function(){
        this.$todayContainer.empty();
        this.$olderContainer.empty();
    },
    getCommentedString: function(commenters){
        if(commenters.length == 1){
            return "New comment by " + commenters[0].commenter;
        }
        return commenters.length + " new comments";
    },
    createPage: function(){
        this.emptyNotificationsPage();
        var notSeenArr = notifications.data.notSeen;

        for(var i = notSeenArr.length - 1; i >= 0; i--){
            if(notSeenArr[i]){
                var info = notifications.getCommentedString(notSeenArr[i]);
                var time = utils.dateFormatHourMinute(notSeenArr[i][0].lastUpdate);
                var onOff = "On";
                var rideID = i;
                var title = notifications.getTitle(rideID);
                $comp = notifications.createnotifComponent(title, info, time, onOff, rideID);

                if(utils.isToday(notSeenArr[i][0].lastUpdate)){
                    this.$todayContainer.append($comp);
                } else {
                    this.$olderContainer.append($comp);
                }
            }
        }

        var seenArr = notifications.data.seen;
        for(var i = 0; i < seenArr.length; i++){
            var info = notifications.getCommentedString(seenArr[i].box);
            var time = utils.dateFormatHourMinute(seenArr[i].box[0].lastUpdate);
            var onOff = "Off";
            var rideID = seenArr[i].rideID;
            var title = notifications.getTitle(rideID);
            $comp = notifications.createnotifComponent(title, info, time, onOff, rideID);
            if(utils.isToday(seenArr[i].box[0].lastUpdate)){
                this.$todayContainer.append($comp);
            } else {
                this.$olderContainer.append($comp);
            }
        }
    },
    getTitle: function(rideID){
        var ride = rides.data[rideID];
        var st = (ride.author == currentUser) ? "Your " : ride.author + "'s ";
        st+= (ride.role == "driver") ? "ride " : "request ";
        st+= (ride.type == "toIDC") ? "to IDC" : "from IDC";
        return st;
    },
    getDateDisplay: function(d){
        if(utils.isToday(d)){
            return utils.dateFormatHourMinute(d);
        }
        return utils.dateFormatter(d);
    },

    createnotifComponent: function(title, info, time, onOff, rideID){
        var $title = $('<div class="item-title">' + title + '</div>');
        var $row = $('<div class="item-title-row"></div>');
        $row.append($title);
        var $subt = $('<div class="item-subtitle">' + info +
            '<span class="timeSpan">' + time + '</span></div>');
        var $inner = $('<div class="item-inner"></div>');
        $inner.append($row).append($subt);
        var $img = $('<div class="item-media"><img id="notifImg' + rideID + '" src="img/notification' + onOff + '.png" width="44"></div>');

        var $a = $('<a href="#ride" class="item-link item-content"></a>');
        $a.append($img).append($inner);
        var $li = $('<li class="rideComponent" onClick="ridePage.handler(' + rideID
            + ');notifications.notifClicked(' + rideID + ')"></li>');
        $li.append($a);
        return $li;
    }

}
$$('.notification-default').on('click', function () {
    myApp.addNotification({
        title: 'CartPool',
        message: 'Guy just added new item to the cart '
    });
});