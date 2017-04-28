
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
   //  $(".back").on('click', function(){
   //      ridePage.current = null;
   //  });
    $('#logoutB').on('click', logout);
    $("#commentForm").on('submit', comments.createCommentHandler);
   //  $.getJSON( "/www/futureRides", function(data) {
   //      rides.init(data);
   //  })
   //  .fail(function(){
   //      console.log('error while trying to get data from server');
   //  });
   //  $.getJSON( "/www/getCurrentUser", function(data) {
   //      currentUser = data;
   //  })
   //  .fail(function(){
   //      console.log('error while trying to get data from server');
   //  });
    newPostSubmit.init();
    notifications.init();
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



var comments = {
    createCommentHandler: function(e){
        e.preventDefault();
        comments.addOneComment();
    },
    highlightCallback: function($node){
        new Highlighter($node);
    },
    addOneComment: function(){
      //   var message = document.getElementById('message').value;
      //   $.post('/www/CreateNewComment', {message: message , rideID: ridePage.current} , function(data){
      //       if(data){
      //           ridePage.data.comments.push(data);
      //           comments.createCommentComponent(data, comments.highlightCallback);
      //           document.getElementById('message').value = "";
      //       }
      //       else{
      //           alert("error uploading the comment");
      //       }
      //   });
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
      //   $.getJSON( "/www/notifications", function(data) {
      //   notifications.data = data;
      //   notifications.updateIcon();
      //   })
      //   .fail(function(){
      //       console.log('error while trying to get data from server');
      //   });
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
