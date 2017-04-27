var myApp = angular.module('cartpoolApp', ['ngCookies']);

myApp.controller('mainCtrl', function myController($scope, $timeout, $http, $cookies, $window) {

    // Verify cookie's value to assure the user logged in
    // If he got here before logging in, send him to login page
    var cartPoolCookie = $cookies.get('cartpool_session');

    if (!cartPoolCookie){
        $window.location.href = "/static/public/login.html";}
    else {
        // Load all products to scope
        $http.get("/get_products").then(function (response) {
            $scope.prods = response.data;
        });

        $scope.uid = cartPoolCookie.id;
        $scope.display_name = cartPoolCookie.display_name;
        $scope.reload_data();
    }

    $scope.reload_data = function(){
        $http.get("/get_user_data", {u_id : $scope.uid}).then(function (response) {
            $scope.carts = response.data;
        });
    }
});