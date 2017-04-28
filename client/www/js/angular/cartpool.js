var myApp = angular.module('cartpoolApp', ['ngCookies', 'ngMaterial']);

myApp.controller('mainCtrl', function myController($scope, $timeout, $http, $cookies, $window, $interval) {

    // Verify cookie's value to assure the user logged in
    // If he got here before logging in, send him to login page
    var cartPoolCookie = $cookies.get('cartpool_session');

    $scope.reload_data = function () {
        $http.get("/get_user_data", {params: {u_id: $scope.uid}}).then(function (response) {
            $scope.carts = response.data;

            if ($scope.cart) {
                for (var i = 0; i < $scope.carts.length; i++) {
                    var cart = $scope.carts[i];

                    if (cart.id == $scope.cart.id) {
                        $scope.choose_cart(cart);
                        return;
                    }
                }
            }
        });
    };

    $scope.choose_cart = function (cart) {
        $scope.cart = cart;
        $scope.cart.ready_to_buy = true;

        // Build members string
        $scope.members = cart.members[0].display_name;
        for (var i = 0; i < cart.members.length; i++) {
            var member = cart.members[i];
            if (i > 0) {
                $scope.members += ', ' + member.display_name;
            }

            if (member.id == $scope.uid){
                $scope.cart.status = member.status;
            }
            if (member.status == 0 && cart.owner != member.id){
                $scope.cart.ready_to_buy = false;
            }
        }

        // Build cart items
        $scope.my_items = [];
        $scope.shared_items = [];
        $scope.others_items = [];
        $scope.my_sum = 0;
        $scope.shared_sum = 0;
        $scope.others_sum = 0;
        for (var i = 0; i < cart.products.length; i++) {
            var product = cart.products[i];
            product.sum = product.quantity * product.price;

            if (product.owners == $scope.uid) {
                $scope.my_items.push(product);
                $scope.my_sum += product.sum;
            }
            else if (product.owners == 0) {
                $scope.shared_items.push(product);
                $scope.shared_sum += product.sum;
            }
            else {
                $scope.others_items.push(product);
                $scope.others_sum += product.sum;
            }
        }

        $scope.sum_sum = $scope.my_sum + ($scope.shared_sum / $scope.cart.members.length);
    };


    $scope.add_comment = function (comment) {
        $http.get("/add_comment", {
            params: {
                u_id: $scope.uid,
                c_id: $scope.cart.id,
                comment: comment
            }
        }).then(function (response) {
            if (response) {
                $scope.reload_data();
                $scope.new_comment = '';
            }
        });
    };

    $scope.logout = function () {
        $cookies.remove('cartpool_session');
        location.reload();
    };

    $scope.add_cart = function (name, description) {
        $http.get("/create_cart", {
            params: {
                user_id: $scope.uid,
                name: name,
                description: description
            }
        }).then(function (response) {
            if (response) {
                location.reload();
            }
        });
    };

    $scope.delete_cart = function (c_id) {
        if (confirm('האם אתה בטוח שברצונך למחוק עגלה זו?')) {
            $http.get("/delete_cart", {
                params: {
                    c_id: c_id
                }
            }).then(function (response) {
                if (response) {
                    location.reload();
                }
            });
        }
    };

    $scope.add_user_to_cart = function (u_name) {
        $http.get("/add_user_cart", {
            params: {
                u_name: u_name,
                c_id: $scope.cart.id
            }
        }).then(function (response) {
            if (response.data == "false") {
                alert('היוזר לא קיים');
            }
            else{
                $scope.reload_data();
            }
        });
    };

    $scope.add_cart_item = function(c_id, owner, i_id, quantity){
        if ($scope.cart.ready_to_buy && $scope.cart.members.length > 1){
            if (!confirm("העגלה מאושרת לתשלום, הוספת פריט תבטל את האישור, האם ברצונך להמשיך?")){
                return;
            }
        }

        $http.get("/add_cart_item", {
            params: {
                c_id: c_id,
                owner: owner,
                i_id: i_id,
                quantity: quantity
            }
        }).then(function (response) {
            $scope.reload_data();
        });
    };

    $scope.approve_cart = function(c_id, u_id){
        $http.get("/approve_cart", {
            params: {
                c_id: c_id,
                u_id: u_id
            }
        }).then(function (response) {
            $scope.reload_data();
            var msg = "ההזמנה בוצעה בהצלחה וייגבו ממך ";
            msg += $scope.sum_sum.toFixed(2);
            msg += "שקלים מחשבונך בבנק פפר.";
            alert(msg);
        });
    };

    $scope.remove_cart_approve = function(c_id, u_id){
        $http.get("/remove_cart_approve", {
            params: {
                c_id: c_id,
                u_id: u_id
            }
        }).then(function (response) {
            $scope.reload_data();
            alert("הביטול בוצע בהצלחה ולא ייגבה מחשבונך בבנק פפר כסף עבור הזמנה זו");
        });
    };

    $scope.do_pay = function (){
        if ($scope.cart.ready_to_buy && $scope.cart.members.length > 1){
            var msg = "העגלה אושרה בהצלחה ומנהל העגלה יוכל לגבות ממך ";
            msg += $scope.sum_sum.toFixed(2);
            msg += "שקלים כאשר יבוצע המשלוח.";
            alert(msg);
        }
        else{
            alert("לא כל חברי העגלה אישרו");
        }
    };

    if (!cartPoolCookie) {
        $window.location.href = "/static/public/login.html";
    }
    else {
        // Load all products to scope
        cartPoolCookie = cartPoolCookie.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace('\\054', ',');
        cartPoolCookie = JSON.parse(cartPoolCookie);
        $http.get("/get_products").then(function (response) {
            $scope.prods = response.data;
        });

        $scope.uid = cartPoolCookie.id;
        $scope.display_name = cartPoolCookie.display_name;
        $scope.reload_data();
        $interval($scope.reload_data, 3000);
    }
});
