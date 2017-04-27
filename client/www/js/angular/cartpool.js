var myApp = angular.module('cartpoolApp', ['ngCookies']);

myApp.controller('mainCtrl', function myController($scope, $timeout, $http, $cookies, $window) {

    // Verify cookie's value to assure the user logged in
    // If he got here before logging in, send him to login page
    var cartPoolCookie = $cookies.get('cartpool_session');

    if (!cartPoolCookie)
        $window.location.href = "/static/public/login.html";



    // Load all products to scope
    $http.get("/get_products").then(function (response) {
        $scope.prods = response.data;
    });
});