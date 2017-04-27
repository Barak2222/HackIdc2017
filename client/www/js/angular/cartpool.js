var myApp = angular.module('cartpoolApp', ['ngCookies']);

myApp.controller('mainCtrl', function myController($scope, $timeout, $http, $cookies, $window) {

    // Verify cookie's value to assure the user logged in
    // If he got here before logging in, send him to login page
    var cartPoolCookie = $cookies.get('cartpool_session');

    $scope.reload_data = function () {
        $http.get("/get_user_data", {params: {u_id: $scope.uid}}).then(function (response) {
            $scope.carts = response.data;

            for (var i = 0; i < $scope.carts.length; i++) {
                var cart = $scope.carts[i];

                if (cart.id == $scope.cart.id) {
                    $scope.choose_cart(cart);
                    return;
                }
            }
        });
    }

    $scope.choose_cart = function (cart) {
        $scope.cart = cart;

        // Build members string
        $scope.members = cart.members[0].display_name;
        for (var i = 1; i < cart.members.length; i++) {
            $scope.members += ', ' + cart.members[i].display_name;
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
    }


});