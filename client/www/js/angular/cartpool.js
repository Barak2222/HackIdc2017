var myApp = angular.module('cartpoolApp', []);

myApp.controller('mainCtrl', function myController($scope, $timeout, $http) {
    $scope.name = "Barak";

    $http.get("/get_products").then(function (response) {
        $scope.prods = response.data;
        $scope.content_ready = true;
    });
});