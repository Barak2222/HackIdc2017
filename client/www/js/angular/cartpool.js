var myApp = angular.module('cartpoolApp', []);

myApp.controller('MainController', function myController($scope, $http) {
    $scope.get_all = function () {
        $http.get("/get_products").then(function (response) {
                $scope.all_products = response.data;
            })
    };
});