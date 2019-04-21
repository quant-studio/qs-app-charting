//=============================
angular.module('quant-studio', [])

.directive('appCharts', function() {
	var component = function($scope, element, attrs, ctlr, transcludeFn) {

		// Utilities
		$scope.safeApply = function(fn) {
			var phase = this.$root.$$phase;
			if(phase == '$apply' || phase == '$digest') {
				if(fn && (typeof(fn) === 'function')) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
		};
		
		
	};
	
	return {
		link: 			component,
		scope:			{
			
		},
		templateUrl:	'/js/app/app.html'
	};
})

//=============================
angular.module('app', ['quant-studio'])

.controller('main', function($scope, $locale) {
	//console.log("main init()", $scope);
});
