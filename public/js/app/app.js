

/*
	Centralized Dialog handling to make things easier
*/
var dialog = {
	visible:	true,
	front:	 	"",
	status:	 	{},
	payload:	{},
	open:	function(id, payload) {
		//console.info("Dialog.open", id, payload);
		dialog.status[id]	= true;
		dialog.payload[id]	= payload;
		dialog.front			= id;
	},
	close:	function(id) {
		dialog.status[id]	= false;
		delete dialog.payload[id];
		dialog.front	= null;
	},
	hide:	function() {
		dialog.visible	= false;
		$('.app-dialog').hide();
	},
	show:	function() {
		dialog.visible	= true;
		$('.app-dialog').show();
	},
};



/*
	Declare the module
*/
angular.module('quant-studio', [])



/*
	Plot Editor
*/
.directive('plotEditor', ['$compile', '$timeout', function ($compile, $timeout) {
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
		
		
		$scope.dialog = dialog;
		
		
		
		
		
		var eventSeries = [];
		
		$scope.editor	= {
			form: [{
				label:	"Title",
				name:	"title",
				type:	"input"
			}],
			eventForm: [{
				label:	"Display On",
				name:	"eventSerie",
				type:	"list",
				list:	eventSeries
			}],
			bounds: [{
				label:	"Width",
				name:	"width",
				type:	"text"
			},{
				label:	"Height",
				name:	"height",
				type:	"text"
			},{
				label:	"Top",
				name:	"top",
				type:	"text"
			},{
				label:	"Left",
				name:	"left",
				type:	"text"
			}],
			// Charts
			addChart:	function() {
				//console.log("addChart",$scope.plotEditor);
				$scope.dialog.open('chart-selector', {
					plot:	$scope.plotEditor.n,
					charts:	$scope.plotEditor.plot.charts
				});
			},
			editChart:	function(chart) {
				//console.log("editChart",chart);
				$scope.dialog.open('edit-chart', {
					chart:	chart,
					plots:	$scope.plotEditor.plots
				});
			},
			removeChart:	function(chart) {
				var c = confirm("Are you sure?");
				if (!c) {
					return false;
				}
				//console.log("removeChart",chart);
				window.Arbiter.inform('project.charting.chart.remove', chart);
				$timeout(function() {
					$scope.safeApply(function() {
						//console.log("plotEditor.plot.charts",$scope.plotEditor.plot.charts);
						$scope.plotEditor.plot.charts	= _.filter($scope.plotEditor.plot.charts, function(item) {
							return item.id != chart.id;
						});
						
						$scope.chart.refresh($scope.app.tabs.selected.id);
					});
				});
				/*$scope.dialog.open('edit-chart', {
					chart:	chart,
					plots:	$scope.plotEditor.plots
				});*/
			},
			canRemoveChart:	function(chart) {
				if ($scope.plotEditor && $scope.plotEditor.plot.charts && $scope.plotEditor.plot.charts.length==1) {
					return false;
				}
				return true;
			},
			// Events
			addEvent:	function() {
				//console.log("addEvent",$scope.plotEditor);
				if (!$scope.plotEditor.plot.events) {
					$scope.plotEditor.plot.events = [];
				}
				var event	= {
					id:		sdk.sid(),
					label:	'BUY',
					source:	'',
					marker:	{
						shape:		'rect',
						bgColor:	'#1E88E5',
						textColor:	'#ffffff',
						strokeColor:'#1E88E5',
						stokeWidth:	1,
						fontSize:	10,
						fontWeight:	600
					}
				};
				$scope.plotEditor.plot.events.push(event);
				$scope.editor.editEvent(event);
			},
			editEvent:	function(event) {
				//console.log("editEvent",event);
				$scope.dialog.open('edit-event', {
					event:	event,
					plots:	$scope.plotEditor.plots
				});
			},
			removeEvent:	function(chart) {
				var c = confirm("Are you sure?");
				if (!c) {
					return false;
				}
				//console.log("removeChart",chart);
				
				$timeout(function() {
					$scope.safeApply(function() {
						//console.log("plotEditor.plot.charts",$scope.plotEditor.plot.charts);
						$scope.plotEditor.plot.events	= _.filter($scope.plotEditor.plot.events, function(item) {
							return item.id != chart.id;
						});
						
						window.Arbiter.inform('project.charting.event.remove', chart);
						//$scope.chart.refresh($scope.app.tabs.selected.id);
					});
				});
				/*$scope.dialog.open('edit-chart', {
					chart:	chart,
					plots:	$scope.plotEditor.plots
				});*/
			}
		};
		
		$scope.tabs	= {
			selected:	false,
			select:		function(id) {
				$scope.safeApply(function() {
					$scope.tabs.selected	= id;
				});
			},
			is:		function(id) {
				return $scope.tabs.selected	== id;
			}/*,
			create:		function() {
				$scope.safeApply(function() {
					$scope.tabs.tabs.push({
						label: 'Panel #'+($scope.tabs.tabs.length+1)
					});
				});
			}*/
		};
		$scope.tabs.select('charts');
		
		
		$scope.$watch('plotEditor', function() {
			if ($scope.plotEditor) {
				$scope.safeApply(function() {
					//console.log("$scope.plotEditor",$scope.plotEditor);
					$scope.plotEditor.settings = _.extend({
						width:	'',
						height:	'',
						top:	'',
						left:	''
					}, $scope.plotEditor.settings);
					
					
					
					eventSeries = [];
					_.each($scope.plotEditor.plot.charts, function(chart) {
						if (chart.settings) {
							_.each(chart.settings, function(v,k) {
								if ((/[a-z0-9]{10}\:/gmi).test(v)) {
									eventSeries.push({
										label:	k,
										value:	v
									});
								}
							});
						}
					});
					//console.log("eventSeries",eventSeries);
					$scope.editor.eventForm	= [{
						label:	"Display On",
						name:	"eventSerie",
						type:	"list",
						list:	eventSeries
					}];
				});
			}
		});
		
		// Increment/decrement the counter of chart display
		
		$scope.$on('$destroy', function() {
			
		});
	}
	return {
		link: 			component,
		replace:		true,
		transclude:		true,
		scope:			{
			plotEditor:	'='
		},
		templateUrl:	'/js/app/plot-editor.html'
	};
}])



/*
	Chart Editor
*/
.directive('chartEditor', ['$timeout', function ($timeout) {
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
		
		
		$scope.dialog = dialog;
		
		$scope.chart	= {
			init:	function() {
				$scope.safeApply(function() {
					if (!$scope.chart || !$scope.chartEditor.chart) {
						return false;
					}
					$scope.chart.defaultForm	= [{
						label:		'Name',
						name:		'name',
						value:		1,
						type:		'input'
					}];
					/*
					if ($scope.chartEditor.plots) {
						$scope.chart.defaultForm.push({
							label:		'Plot',
							name:		'plot',
							value:		1,
							type:		'list',
							list: _.map($scope.chartEditor.plots, function(item) {
								return {
									label:	item.settings?item.settings.title:'',
									value:	item.n
								}
							})
						});
					}*/ 
				});
				// Force the plot location?
				/*if ($scope.chart.hasOwnProperty('plot')) {
					console.log("$scope.chartEditor.chart",$scope.chartEditor.chart);
					$scope.chartEditor.chart.settings.plot	= chart.plot;
				}*/
			}
		};
		
		
		$scope.$watch('chartEditor', function() {
			if ($scope.chartEditor && $scope.chartEditor.chart) {
				//$scope.chartEditor.chart	= $scope.chartEditor.chart;
				//$scope.chartEditor.plots	= $scope.chartEditor.plots;
				//console.log("$scope.chartEditor",$scope.chartEditor);
				$scope.chart.init();
			}
		});
		
		
		// Increment/decrement the counter of chart display
		//$scope.core.counters.$inc('chart-editing', 1);
		$scope.$on('$destroy', function() {
			//$scope.core.counters.$inc('chart-editing', -1);
		});
	}
	return {
		link: 			component,
		replace:		true,
		transclude:		true,
		scope:			{
			chartEditor:	'='
		},
		templateUrl:	'/js/app/chart-editor.html'
	};
}])



/*
	Easy Advanced Form
*/
.directive('appForm', ['$timeout', function ($timeout) {
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
		
		$scope.dialog = dialog;
		
		$scope.form	= {
			refresh:	function() {
				
			},
			selectData:	function(line, value) {
				// Create a unique ID
				$scope.form.dataSelectionRequest	= {
					field:	line,
					value:	value,
					id:		sdk.sid()
				};
				
				//console.log("Select data", $scope.form.dataSelectionRequest);
				window.Arbiter.inform("form.data.select", $scope.form.dataSelectionRequest);
			}
		};
		
		window.Arbiter.subscribe('form.data.selected', function(data) {
			$scope.safeApply(function() {
				if ($scope.form.dataSelectionRequest && data && data.source && data.source.id==$scope.form.dataSelectionRequest.id) {
					//console.log("data selected", data);
					$scope.form.dataSelectionRequest.value	= data.port.box+':'+data.port.id;
					
					$scope.values[data.source.field.name] = data.port.box+':'+data.port.id;
				}
			});
		});
		
		
		
		$scope.$watch('appForm', function() {
			if ($scope.appForm) {
				//console.log("$scope.appForm",$scope.appForm);
				$scope.form.refresh();
			}
		});
	}
	return {
		link: 			component,
		replace:		true,
		transclude:		true,
		scope:			{
			appForm:	'=',
			values:		'='
		},
		templateUrl:	'/js/app/form.html'
	};
}])



.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keypress", function (event) {
			if (event.which === 13) {
				scope.$apply(function () {
					scope.$eval(attrs.ngEnter);
				});
				event.preventDefault();
			}
		});
	};
})
.directive('ngEscape', function () {
	return function (scope, element, attrs) {
		var target	= $(element);
		if (attrs.global) {
			target	= $(document);
		}
		target.on("keypress", function (event) {
			if (event.keyCode === 27) {
				scope.$apply(function () {
					scope.$eval(attrs.ngEscape);
				});
				event.preventDefault();
			}
		});
	};
})

/*
	The main app, handling charting
*/
.directive('appCharts', ['$timeout', function ($timeout) {
	var component = function($scope, element, attrs, ctlr, transcludeFn) {
		
		$scope.safeApply = function(fn, force) {
			var phase = this.$root.$phase;
			if(phase == '$apply' || phase == '$digest') {
				if(fn && (typeof(fn) === 'function')) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
		};
		
		setInterval(function() {
			$scope.safeApply(function() {
				
			});
		}, 1000);
		
		
		var chartInstance;
		
		anychart.theme('darkBlue');
		
		var boundItv;
		
		$scope.dialog = dialog;
		
		$scope.tabs	= {};
		
		
		$scope.chart	= {
			dragChartTypes:	[{
				label:	'Line Chart',
				value:	'ec118b4b3a'
			},{
				label:	'Area Chart',
				value:	'rJAJdF4_X'
			},{
				label:	'Column Chart',
				value:	'itgTiEcOu'
			},{	
				label:	'Gradient Line Chart',
				value:	'8a67c04058'
			},{
				label:	'Positive/Negative Area Chart',
				value:	'HkmxEEv_Q'
			},{
				label:	'Events',
				value:	'event'
			},{
				label:	'Candlesticks',
				value:	'605cb54dfb'
			}],
			menu: {
				icon:		'fas fa-wrench',
				children: [{
					icon:		'fas fa-ban',
					tooltip:	'Delete the panel',
					color:		'#D32F2F',
					callback:	function(plot) {
						//console.log("delete", plot);
						var c = confirm("Are you sure?\nAll the charts on this plot will be deleted.");
						if (!c) {
							return false;
						}
						$scope.chart.removePlot(plot)
					}
				}, {
					icon:		'fas fa-cog',
					tooltip:	'Edit the panel',
					color:		'#9CCC65',
					callback:	function(plot) {
						$scope.chart.editPlot(plot)
					}
				}]
			},
			init:	function() {
				//console.log("init()", window.sdk.data.app);
				// Save the data locally
				$scope.project	= window.sdk.data.project;
				$scope.datasets	= window.sdk.data.datasets;
				$scope.app		= window.sdk.data.app;
				
				
				if (!$scope.app.tabs) {
					$scope.app.tabs = {
						selected:	{
							id:		'main',
							label:	'Panel #1'
						},
						tabs:		[{
							id:		'main',
							label:	'Panel #1'
						}]
					};
				}
				
				
				if (!$scope.app.charts && $scope.app.charting) {
					$scope.app.charts = {
						main: {
							plots: []
						}
					}
					$scope.app.charts['main'] = _.extend({}, $scope.app.charting);	// Copy from V1
					delete $scope.app.charting;	// Delete the original chart
					// Save
					sdk.send('save:app', $scope.app);
				} else if (!$scope.app.charts && $scope.project.charting) {
					$scope.app.charts = {
						main: {
							plots: []
						}
					}
					$scope.app.charts['main'] = _.extend({}, $scope.project.charting);	// Copy from in-project
					delete $scope.project.charting;
					// Save
					sdk.send('save:app', $scope.app);
				}
				
				
				// Embed the chart models instead of loading them from the API
				var chartModels = ([
					{
						"_id": "5c36a1b3e6f37378d0299219",
						"id": "605cb54dfb",
						"created": "2019-01-10T01:36:49.259Z",
						"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
						"updated": "2019-01-10T01:36:49.260Z",
						"type": "chart",
						"data": {
							"author": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"author_name": "Julien Loutre",
							"code": "chart.scroller().line(mapping);",
							"description": "The classic Japanese  Candlestick chart.",
							"id": "605cb54dfb",
							"image": "https://res.cloudinary.com/twenty-six-medias/image/upload/v1537125202/quant-studio-charts/fxoispm80cobh33yfji5.png",
							"name": "Japanese Candlesticks",
							"publishedVersion": {
								"build": 2,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"status": "public",
							"type": {
								"author_name": "Julien Loutre",
								"code": "var instance = plot.candlestick(mapping);\r\n\r\n// create scroller series with mapped data\r\nchart.scroller().line(mapping);\r\n\r\nreturn instance;",
								"description": "Japanese Candlesticks",
								"id": "32f4c7423d",
								"inputs": [
								{
									"label": "Open",
									"name": "open",
									"type": "data",
									"value": ""
								},
								{
									"label": "High",
									"name": "high",
									"type": "data",
									"value": ""
								},
								{
									"label": "Low",
									"name": "low",
									"type": "data",
									"value": ""
								},
								{
									"label": "Close",
									"name": "close",
									"type": "data",
									"value": ""
								}
								],
								"name": "Japanese Candlesticks",
								"status": "public"
							},
							"updated": "2018-09-16T19:13:25.270Z",
							"version": {
								"build": 2,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"saved": {
								"id": "605cb54dfb",
								"name": "Japanese Candlesticks",
								"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
								"folder": "",
								"version": {
									"major": 0,
									"minor": 0,
									"build": 1
								},
								"version_int": 1
							}
						},
						"name": "Japanese Candlesticks",
						"privacy": "standard",
						"folder": "",
						"parent": false,
						"version": {
							"major": 0,
							"minor": 0,
							"build": 1
						},
						"version_int": 1,
						"author": {
							"avatar": "http://quant-studio.imgix.net/bvRJP1NdBJXf66e3i9bPCTJJgRA2/avatar/avatar2-1547089913.jpg?fit=crop&w=50&h=50",
							"username": "Quant-Studio",
							"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2"
						}
					},
					{
						"_id": "5c36a1b3e6f37378d029924d",
						"id": "672c0c4302",
						"created": "2019-01-10T01:36:49.608Z",
						"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
						"updated": "2019-01-10T01:36:49.608Z",
						"type": "chart",
						"data": {
							"author": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"author_name": "Julien Loutre",
							"code": "indicator.normal().fill(inputs.color, 0.3);\nindicator.hovered().fill(inputs.color, 0.6);\nindicator.highStroke(inputs.color, 0.3);\nindicator.lowStroke(inputs.color, 0.3);",
							"description": "Range Area",
							"id": "672c0c4302",
							"image": "https://res.cloudinary.com/twenty-six-medias/image/upload/v1537141086/quant-studio-charts/b8h99taxgdxfekqhwq3p.png",
							"inputs": [
							{
								"defaultValue": "#9CCC65",
								"label": "Color",
								"name": "color",
								"type": "color"
							},
							{
								"defaultValue": 0.5,
								"label": "Thickness",
								"name": "thickness",
								"type": "number"
							}
							],
							"name": "Range Area",
							"publishedVersion": {
								"build": 2,
								"major": 0,
								"minor": 0
							},
							"status": "public",
							"type": {
								"author_name": "Julien Loutre",
								"code": "return plot.rangeArea(mapping);",
								"description": "A range area.",
								"id": "d7df5f46d1",
								"inputs": [
								{
									"label": "High",
									"name": "high",
									"type": "data",
									"value": ""
								},
								{
									"label": "Low",
									"name": "low",
									"type": "data",
									"value": ""
								}
								],
								"name": "Range Area",
								"status": "public"
							},
							"updated": "2018-09-16T23:38:09.875Z",
							"version": {
								"build": 2,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"saved": {
								"id": "672c0c4302",
								"name": "Range Area",
								"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
								"folder": "",
								"version": {
									"major": 0,
									"minor": 0,
									"build": 1
								},
								"version_int": 1
							}
						},
						"name": "Range Area",
						"privacy": "standard",
						"folder": "",
						"parent": false,
						"version": {
							"major": 0,
							"minor": 0,
							"build": 1
						},
						"version_int": 1,
						"author": {
							"avatar": "http://quant-studio.imgix.net/bvRJP1NdBJXf66e3i9bPCTJJgRA2/avatar/avatar2-1547089913.jpg?fit=crop&w=50&h=50",
							"username": "Quant-Studio",
							"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2"
						}
					},
					{
						"_id": "5c36a1b3e6f37378d0299276",
						"id": "8a67c04058",
						"created": "2019-01-10T01:36:50.092Z",
						"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
						"updated": "2019-01-10T01:36:50.092Z",
						"type": "chart",
						"data": {
							"author": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"author_name": "Julien Loutre",
							"code": "// setup color scale ranges\r\nvar lower = parseFloat(inputs.min);\r\nvar higher = parseFloat(inputs.max);\r\nvar colorScale = anychart.scales.ordinalColor();\r\ncolorScale.ranges([{\r\n\t\tless: lower,\r\n\t\tcolor: {\r\n\t\t\tangle: 90,\r\n\t\t\tkeys: [inputs.color_low, '.95 '+inputs.color_med]\r\n\t\t}\r\n\t},\r\n\t{\r\n\t\tfrom: lower,\r\n\t\tto: higher,\r\n\t\tcolor: inputs.color_med\r\n\t},\r\n\t{\r\n\t\tgreater: higher,\r\n\t\tcolor: {\r\n\t\t\tangle: 90,\r\n\t\t\tkeys: ['.15 '+inputs.color_med, inputs.color_high]\r\n\t\t}\r\n\t}\r\n])\r\nindicator.colorScale(colorScale);\r\n\r\n// set series stroke settings using color scale\r\nindicator.stroke(function () {\r\n\treturn anychart.color.setThickness(this.scaledColor, 3);\r\n});",
							"description": "Gradient Line",
							"id": "8a67c04058",
							"image": "https://res.cloudinary.com/twenty-six-medias/image/upload/v1537125138/quant-studio-charts/th3foeqq9ow9t91qbeo7.png",
							"inputs": [
							{
								"defaultValue": 20,
								"label": "Minimum",
								"name": "min",
								"type": "number",
								"value": 0
							},
							{
								"defaultValue": 80,
								"label": "Maximum",
								"name": "max",
								"type": "number",
								"value": 100
							},
							{
								"defaultValue": "#9CCC65",
								"label": "Low Value",
								"name": "color_low",
								"type": "color",
								"value": "#29B6F6"
							},
							{
								"defaultValue": "#03A9F4",
								"label": "Medium Value",
								"name": "color_med",
								"type": "color",
								"value": "#8BC34A"
							},
							{
								"defaultValue": "#D81B60",
								"label": "High Value",
								"name": "color_high",
								"type": "color",
								"value": "#C62828"
							},
							{
								"defaultValue": 1,
								"label": "Thickness",
								"name": "thickness",
								"type": "number",
								"value": 1
							}
							],
							"name": "Gradient Line",
							"publishedVersion": {
								"build": 3,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"status": "public",
							"type": {
								"author_name": "Julien Loutre",
								"code": "return plot.line(mapping);",
								"description": "Line Charts",
								"id": "c562a1499c",
								"inputs": [
								{
									"label": "Value",
									"name": "value",
									"type": "data",
									"value": ""
								}
								],
								"name": "Line Chart",
								"status": "public"
							},
							"updated": "2018-10-14T15:56:43.269Z",
							"version": {
								"build": 5,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"saved": {
								"id": "8a67c04058",
								"name": "Gradient Line",
								"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
								"folder": "",
								"version": {
									"major": 0,
									"minor": 0,
									"build": 1
								},
								"version_int": 1
							}
						},
						"name": "Gradient Line",
						"privacy": "standard",
						"folder": "",
						"parent": false,
						"version": {
							"major": 0,
							"minor": 0,
							"build": 1
						},
						"version_int": 1,
						"author": {
							"avatar": "http://quant-studio.imgix.net/bvRJP1NdBJXf66e3i9bPCTJJgRA2/avatar/avatar2-1547089913.jpg?fit=crop&w=50&h=50",
							"username": "Quant-Studio",
							"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2"
						}
					},
					{
						"_id": "5c36a1b4e6f37378d029929f",
						"id": "HkmxEEv_Q",
						"created": "2019-01-10T01:36:50.585Z",
						"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
						"updated": "2019-01-10T01:36:50.585Z",
						"type": "chart",
						"data": {
							"author": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"author_name": "Quant Studio",
							"code": "indicator.fill(inputs.posColor+' '+inputs.alpha).stroke(inputs.thickness+' '+inputs.posColor);\nindicator.negativeFill(inputs.negColor+' '+inputs.alpha).negativeStroke(inputs.thickness+' '+inputs.negColor);",
							"created": "2018-09-13T00:48:42.573Z",
							"description": "Oscillator Area Chart",
							"id": "HkmxEEv_Q",
							"image": "https://res.cloudinary.com/twenty-six-medias/image/upload/v1537125166/quant-studio-charts/s8uxsfnfuegq0tpzq0ir.png",
							"inputs": [
							{
								"defaultValue": 0.5,
								"label": "Thickness",
								"name": "thickness",
								"type": "number",
								"value": 0.1
							},
							{
								"label": "Alpha",
								"name": "alpha",
								"type": "number",
								"value": 0.65
							},
							{
								"label": "Positive Color",
								"name": "posColor",
								"type": "color",
								"value": "#03A9F4"
							},
							{
								"label": "Negative Color",
								"name": "negColor",
								"type": "color",
								"value": "#D81B60"
							}
							],
							"name": "Oscillator Area Chart",
							"publishedVersion": {
								"build": 1,
								"major": 0,
								"minor": 0
							},
							"status": "public",
							"type": {
								"author_name": "Julien Loutre",
								"code": "return plot.area(mapping);",
								"created": "2018-09-12T06:44:42.367Z",
								"description": "Area Charts",
								"id": "SyfyI4Ld7",
								"inputs": [
								{
									"label": "Value",
									"name": "value",
									"type": "data",
									"value": ""
								}
								],
								"name": "Area Chart",
								"status": "public",
								"uid": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
								"updated": "2018-09-12T06:44:42.367Z",
								"version": {
									"build": 0,
									"major": 0,
									"minor": 0
								}
							},
							"uid": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"updated": "2018-09-16T19:12:49.629Z",
							"version": {
								"build": 3,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"saved": {
								"id": "HkmxEEv_Q",
								"name": "Oscillator Area Chart",
								"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
								"folder": "",
								"version": {
									"major": 0,
									"minor": 0,
									"build": 1
								},
								"version_int": 1
							}
						},
						"name": "Oscillator Area Chart",
						"privacy": "standard",
						"folder": "",
						"parent": false,
						"version": {
							"major": 0,
							"minor": 0,
							"build": 1
						},
						"version_int": 1,
						"author": {
							"avatar": "http://quant-studio.imgix.net/bvRJP1NdBJXf66e3i9bPCTJJgRA2/avatar/avatar2-1547089913.jpg?fit=crop&w=50&h=50",
							"username": "Quant-Studio",
							"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2"
						}
					},
					{
						"_id": "5c36a1b4e6f37378d02992c7",
						"id": "ec118b4b3a",
						"created": "2019-01-10T01:36:51.130Z",
						"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
						"updated": "2019-01-10T01:36:51.130Z",
						"type": "chart",
						"data": {
							"author": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"author_name": "Julien Loutre",
							"code": "indicator.stroke(inputs.color+' '+inputs.thickness);",
							"description": "Basic line chart.",
							"id": "ec118b4b3a",
							"image": "https://res.cloudinary.com/twenty-six-medias/image/upload/v1537125153/quant-studio-charts/g1dvht03dmqmnmpbcc7n.png",
							"inputs": [
							{
								"defaultValue": "#E91E63",
								"label": "Line Color",
								"name": "color",
								"type": "color",
								"value": ""
							},
							{
								"defaultValue": 1,
								"label": "Thickness",
								"name": "thickness",
								"type": "number",
								"value": 1
							}
							],
							"name": "Line",
							"publishedVersion": {
								"build": 3,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"status": "public",
							"type": {
								"author_name": "Julien Loutre",
								"code": "return plot.line(mapping);",
								"description": "Line Charts",
								"id": "c562a1499c",
								"inputs": [
								{
									"label": "Value",
									"name": "value",
									"type": "data",
									"value": ""
								}
								],
								"name": "Line Chart",
								"status": "public"
							},
							"updated": "2018-10-14T16:39:26.508Z",
							"version": {
								"build": 3,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"saved": {
								"id": "ec118b4b3a",
								"name": "Line",
								"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
								"folder": "",
								"version": {
									"major": 0,
									"minor": 0,
									"build": 1
								},
								"version_int": 1
							}
						},
						"name": "Line",
						"privacy": "standard",
						"folder": "",
						"parent": false,
						"version": {
							"major": 0,
							"minor": 0,
							"build": 1
						},
						"version_int": 1,
						"author": {
							"avatar": "http://quant-studio.imgix.net/bvRJP1NdBJXf66e3i9bPCTJJgRA2/avatar/avatar2-1547089913.jpg?fit=crop&w=50&h=50",
							"username": "Quant-Studio",
							"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2"
						}
					},
					{
						"_id": "5c36a1b5e6f37378d02992f0",
						"id": "itgTiEcOu",
						"created": "2019-01-10T01:36:51.451Z",
						"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
						"updated": "2019-01-10T01:36:51.451Z",
						"type": "chart",
						"data": {
							"author": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"author_name": "Julien Loutre",
							"code": "indicator.fill(inputs.color+' '+inputs.alpha).stroke(inputs.thickness+' '+inputs.color);",
							"created": "2018-10-14T14:37:08.929Z",
							"description": "Column Chart",
							"id": "itgTiEcOu",
							"image": "",
							"inputs": [
							{
								"defaultValue": "#9CCC65",
								"label": "Color",
								"name": "color",
								"type": "color",
								"value": "#039BE5"
							},
							{
								"defaultValue": 0.5,
								"label": "Thickness",
								"name": "thickness",
								"type": "number",
								"value": 0.1
							},
							{
								"label": "Alpha",
								"name": "alpha",
								"type": "number",
								"value": 0.65
							}
							],
							"name": "Column Chart",
							"publishedVersion": {
								"build": 1,
								"major": 0,
								"minor": 0
							},
							"status": "public",
							"type": {
								"author_name": "Julien Loutre",
								"code": "return plot.column(mapping);",
								"description": "Column Chart",
								"id": "7d11c74de4",
								"inputs": [
								{
									"label": "Value",
									"name": "value",
									"type": "data",
									"value": ""
								}
								],
								"name": "Column Chart",
								"status": "public"
							},
							"uid": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"updated": "2018-10-14T15:48:38.300Z",
							"version": {
								"build": 2,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"saved": {
								"id": "itgTiEcOu",
								"name": "Column Chart",
								"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
								"folder": "",
								"version": {
									"major": 0,
									"minor": 0,
									"build": 1
								},
								"version_int": 1
							}
						},
						"name": "Column Chart",
						"privacy": "standard",
						"folder": "",
						"parent": false,
						"version": {
							"major": 0,
							"minor": 0,
							"build": 1
						},
						"version_int": 1,
						"author": {
							"avatar": "http://quant-studio.imgix.net/bvRJP1NdBJXf66e3i9bPCTJJgRA2/avatar/avatar2-1547089913.jpg?fit=crop&w=50&h=50",
							"username": "Quant-Studio",
							"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2"
						}
					},
					{
						"_id": "5c36a1b5e6f37378d0299317",
						"id": "rJAJdF4_X",
						"created": "2019-01-10T01:36:51.950Z",
						"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
						"updated": "2019-01-10T01:36:51.950Z",
						"type": "chart",
						"data": {
							"author": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"author_name": "Julien Loutre",
							"code": "indicator.fill(inputs.color+' '+inputs.alpha).stroke(inputs.thickness+' '+inputs.color);",
							"created": "2018-09-11T00:10:13.770Z",
							"description": "Area Chart",
							"id": "rJAJdF4_X",
							"image": "https://res.cloudinary.com/twenty-six-medias/image/upload/v1537145853/quant-studio-charts/vdkmi8p2lpmrwlquj9bx.png",
							"inputs": [
							{
								"defaultValue": "#9CCC65",
								"label": "Color",
								"name": "color",
								"type": "color",
								"value": "#039BE5"
							},
							{
								"defaultValue": 0.5,
								"label": "Thickness",
								"name": "thickness",
								"type": "number",
								"value": 0.1
							},
							{
								"label": "Alpha",
								"name": "alpha",
								"type": "number",
								"value": 0.65
							}
							],
							"name": "Area Chart",
							"publishedVersion": {
								"build": 4,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"status": "public",
							"type": {
								"author_name": "Julien Loutre",
								"code": "return plot.area(mapping);",
								"created": "2018-09-12T06:44:42.367Z",
								"description": "Area Charts",
								"id": "SyfyI4Ld7",
								"inputs": [
								{
									"label": "Value",
									"name": "value",
									"type": "data",
									"value": ""
								}
								],
								"name": "Area Chart",
								"status": "public",
								"uid": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
								"updated": "2018-09-12T06:44:42.367Z",
								"version": {
									"build": 0,
									"major": 0,
									"minor": 0
								}
							},
							"uid": "MFLTP8v5bUbKz9hS1xmNHvJzPO03",
							"updated": "2018-09-17T02:47:56.213Z",
							"version": {
								"build": 4,
								"image": false,
								"major": 0,
								"minor": 0
							},
							"saved": {
								"id": "rJAJdF4_X",
								"name": "Area Chart",
								"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2",
								"folder": "",
								"version": {
									"major": 0,
									"minor": 0,
									"build": 1
								},
								"version_int": 1
							}
						},
						"name": "Area Chart",
						"privacy": "standard",
						"folder": "",
						"parent": false,
						"version": {
							"major": 0,
							"minor": 0,
							"build": 1
						},
						"version_int": 1,
						"author": {
							"avatar": "http://quant-studio.imgix.net/bvRJP1NdBJXf66e3i9bPCTJJgRA2/avatar/avatar2-1547089913.jpg?fit=crop&w=50&h=50",
							"username": "Quant-Studio",
							"uid": "bvRJP1NdBJXf66e3i9bPCTJJgRA2"
						}
					}
				]);
				
				//$scope.safeApply(function() {
					$scope.charts = _.map(chartModels, function(item) {
						return item.data;
					});
					$scope.charts = _.indexBy($scope.charts, function(item) {
						return item.id;
					});
				//});
			},
			editPlot:	function(plot) {
				//console.log("editPlot", plot);
				$scope.dialog.open("edit-plot", {
					plot:		plot,
					plots:		$scope.app.charts[$scope.app.tabs.selected.id].plots
				});
			},
			removePlot:	function(plot) {
				$scope.app.charts[$scope.app.tabs.selected.id].plots = _.filter($scope.app.charts[$scope.app.tabs.selected.id].plots, function(item) {
					return item.id!=plot.id;
				});
				
				$scope.app.charts[$scope.app.tabs.selected.id].plots = _.map($scope.app.charts[$scope.app.tabs.selected.id].plots, function(item, n) {
					item.order	= n;
					return item;
				});
				
				$scope.chart.refresh($scope.app.tabs.selected.id);
				
				return false;
			},
			refresh:	function(tabId) {
				
				
				//console.log("Chart: refresh", tabId);
				
				if (!tabId || !$scope.app || !$scope.datasets || _.keys($scope.datasets).length==0) {
					return false;
				}
				
				clearInterval(boundItv);
				
				
				
				if (!$scope.app.charts) {
					$scope.app.charts = {};
				}
				if (!$scope.app.charts[tabId]) {
					$scope.app.charts[tabId] = {
						plots: []
					}
				}
				
				
				if (!$scope.app.charts[tabId] || ($scope.app.charts[tabId].plots&&$scope.app.charts[tabId].plots.length==0)) {
					$scope.safeApply(function() {
						$scope.app.charts[tabId] = {
							plots: []
						}
						//console.log("$scope.project.charting",$scope.project.charting);
						// Import from the old charts?
						if ($scope.project.charting && $scope.project.charting.plots && _.isArray($scope.project.charting.plots)) {
							$scope.app.charts[tabId].plots	= $scope.project.charting.plots;
						}
					});
				}
				
				var plotRefs	= {};
				
				
				
				// If there was a chart setup already, clear it
				if (chartInstance) {
					chartInstance.dispose();
				}
				chartInstance	= anychart.stock();
				
				
				// Process the events
				var events = {};
				
				
				_.each($scope.app.charts[tabId].plots, function(plotData) {
					// Events
					if (plotData.events) {
						if (!events[plotData.id]) {
							events[plotData.id] = [];
						}
						
						_.each(plotData.events, function(eventSettings) {
							
							// Map the dataset for that chart
							var mapObj	= {
								x:		'd',
								value:	eventSettings.source
							};
							
							// Find the boxId of the value
							var valueParts	= eventSettings.source.split(':');
							var boxId		= valueParts[0];
							if (!$scope.datasets[boxId]) {
								return false;
							}
							
							var dataTable = anychart.data.table('d');
							dataTable.addData($scope.datasets[boxId]);
							mapping		= dataTable.mapAs(mapObj);
							
							// Find the signals
							var signals  = _.filter($scope.datasets[boxId], function(item, n) {
								return item[eventSettings.source]==1;
							});
							
							//console.log("signals",signals);
							
							// Process the signals, add to the event array
							var evts = _.map(signals, function(item, n) {
								return {
									symbol:         eventSettings.label||"SIGNAL",
									date:           item.d,
									description:    eventSettings.label||"SIGNAL",
									"normal":   {
										"type":			eventSettings.marker.shape||'rect',
										"width":		eventSettings.marker.shape.width||40,
										"fill":			eventSettings.marker.bgColor,
										"stroke":		(eventSettings.marker.strokeWidth||1).toString()+" "+eventSettings.marker.bgColor,
										"fontColor":	eventSettings.marker.textColor,
										"fontSize":		eventSettings.marker.fontSize||10,
										"fontWeight":	eventSettings.marker.fontWeight||600,
										"connector":	{
											"stroke":	(eventSettings.marker.strokeWidth||1).toString()+" "+eventSettings.marker.bgColor
										}
									}
								};
							});
							
							//console.log("evts", evts);
							
							// Merge
							events[plotData.id] = events[plotData.id].concat(evts);
						});
						
					}
					
					// Get the plot instance
					var plot	= chartInstance.plot(parseInt(plotData.order));
					
					plotRefs[plotData.id]	= plot;
					
					// Charts
					_.each(plotData.charts, function(chartData) {
						
						/*var mapObj	= _.extend(chartData.settings, {
							x:		'd'
						});*/
						
						
						// Find the boxId of the value
						if (chartData.data.id=='605cb54dfb') {	// Candlestick
							var mapObj	= {
								x:		'd',
								open:	chartData.settings.open,
								high:	chartData.settings.high,
								low:	chartData.settings.low,
								close:	chartData.settings.close
							};
							var valueParts	= chartData.settings.open.split(':');
						} else {
							var mapObj	= {
								x:		'd',
								value:	chartData.settings.value
							};
							var valueParts	= chartData.settings.value.split(':');
						}
						
						var boxId		= valueParts[0];
						if (!$scope.datasets[boxId]) {
							return false;
						}
						
						//console.log("$scope.datasets[boxId]", mapObj, $scope.datasets[boxId]);
						
						var dataTable = anychart.data.table('d');
						dataTable.addData($scope.datasets[boxId]);
						mapping		= dataTable.mapAs(mapObj);
						
						// Eval the chart type code
						try {
							var codeType = eval('(function(plot, mapping, chart, anychart) {'+chartData.data.type.code+'})');
							var indicator = codeType(plot, mapping, chartInstance, anychart);
							indicator.name(chartData.settings.name);
						} catch (e) {
							console.log("Chart Type Error:",e);
						}
						
						
						// Eval the chart code
						try {
							var codeMain = eval('(function(data, plot, mapping, inputs, chart, indicator, anychart) {'+chartData.data.code+'})');
							codeMain($scope.datasets[boxId], plot, mapping, chartData.settings, chartInstance, indicator, anychart);
						} catch (e) {
							console.log("Chart Error:",e);
						}
					});
					
					// Events?
					if (events[plotData.id]) {
						//console.log("events found",events[plotData.id]);
						plot.eventMarkers({
							"groups": [{
								"data": events[plotData.id]
							}]
						});
						plot.eventMarkers().format(function (){
							return this.getData("symbol");
						});
						plot.eventMarkers().position("series");
						plot.eventMarkers().seriesId(0);
					}
				});
				
				
				
				// Get the last x candles
				//var lastX	= dataset.slice(-100);
				
				//chartInstance.selectRange($scope.chart.toDateString(lastX[0].d), $scope.chart.toDateString(lastX[lastX.length-1].d));
				
				// set container id for the chart
				chartInstance.container('container');
				// initiate chart drawing
				chartInstance.draw();
				
				
				// Restore the scroller zoom
				if ($scope.app.charts[tabId].scrollerRange && sdk.data.user_id /*Custom range only for logged in users*/) {
					//@TODO: range for everybody, but check that the range is valid
					chartInstance.selectRange($scope.app.charts[tabId].scrollerRange.from, $scope.app.charts[tabId].scrollerRange.to);
				}
				
				// Save the scroller zoom when it changes
				chartInstance.listen("selectedrangechangefinish", function(e){
					$scope.app.charts[tabId].scrollerRange = {
						from:	e.firstSelected,
						to:		e.lastSelected
					};
					sdk.send('save:app', $scope.app);
				});
				
				boundItv = setInterval(function() {
					_.each(plotRefs, function(plot,k) {
						var bounds	= plot.getPixelBounds();
						//console.log("bounds",k,bounds.top);
						var plotData = _.find($scope.app.charts[tabId].plots, function(item) {
							return item.id == k;
						});
						if (plotData) {
							plotData.bounds = JSON.parse(angular.toJson(bounds));
						}
					});
				}, 1000);
				
				/*
				$timeout(function() {
					_.each(plotRefs, function(plot,k) {
						var bounds	= plot.getPixelBounds();
						//console.log("bounds",k,bounds.top);
						var plotData = _.find($scope.app.charts[tabId].plots, function(item) {
							return item.id == k;
						});
						if (plotData) {
							plotData.bounds = JSON.parse(angular.toJson(bounds));
						}
					});
				});*/
				
			},
			addPlot:	function(options) {
				options = _.extend({}, options, {
					name:	''
				});
				var plot = {
					id:		sdk.sid(),
					name:	options.name,
					charts: [],
					events: [],
					order:	$scope.app.charts[$scope.app.tabs.selected.id].plots.length
				};
				
				$scope.app.charts[$scope.app.tabs.selected.id].plots.push(plot);
				
				return plot;
			},
			addChart:	function(options) {
				options = _.extend({}, options, {});
				var plot = _.find($scope.app.charts[$scope.app.tabs.selected.id].plots, function(item) {
					return item.id == options.plot;
				});
				//console.log("addChart() plot", plot);
				if (!plot) {
					return false;
				}
				
				var chart = {
					id:			sdk.sid(),
					data:		options.chart,
					settings:	options.settings
				};
				plot.charts.push(chart);
				// Refresh the chart
				$scope.chart.refresh($scope.app.tabs.selected.id);
				return chart;
			},
			toDateString:	function(date) {
				return moment(date).format("YYYY-MM-DD HH:mm");
			},
			addFromDrop:	function(options) {
				//console.log("addFromDrop()",options, $scope.charts);
				$scope.safeApply(function() {
					$scope.dialog.open('drag-chart', options);
				});
				return false;
			},
			// Add an event from a drag & drop
			addDragEvents:	function(type, options) {
				
				//console.log("addDragEvents", type, options);
				//console.log("$scope.charts",$scope.charts);
				
				$scope.dialog.close('drag-chart');
				
				//console.log("-------------");
				var plot;
				if (parseInt(options.plot)==-1) {
					//console.log("Creating a new plot");
					plot	= $scope.chart.addPlot();
					//console.log("plot",plot);
					//return false;
				} else {
					plot = _.find($scope.app.charts[$scope.app.tabs.selected.id].plots, function(item) {
						return item.id==options.plot;
					});
				}
				
				//console.log("plot", plot);
				
				
				if (plot) {
					
					if (!plot.events) {
						plot.events = [];
					}
					var event	= {
						id:		sdk.sid(),
						label:	options.data.data.label,
						source:	options.data.data.box+':'+options.data.data.id,
						marker:	{
							shape:		'rect',
							bgColor:	options.data.data.color,
							textColor:	'#ffffff',
							strokeColor:options.data.data.color,
							stokeWidth:	1,
							fontSize:	10,
							fontWeight:	600
						}
					};
					plot.events.push(event);
					
					$scope.chart.refresh($scope.app.tabs.selected.id);
					//console.log("plot 2", plot);
					//console.log("$scope.app 2", $scope.app);
				}
				
				
				
			},
			// Add a chart from a drag & drop
			addDragChart:	function(type, options) {
				
				//console.log("addDragChart", type, options);
				
				$scope.dialog.close('drag-chart');
				
				
				if (type=="event") {
					$scope.chart.addDragEvents(type, options);
					return false;
				}
				
				
				// Find the line chart
				//console.log("$scope.charts", $scope.charts);
				var chart = $scope.charts[type];
				if (!chart) {
					console.log("Chart not found :(");
					return false;
				}
				var plot;
				if (parseInt(options.plot)==-1) {
					//console.log("Creating a new plot");
					plot	= $scope.chart.addPlot();
					//console.log("plot",plot);
					//return false;
				} else {
					plot = _.find($scope.app.charts[$scope.app.tabs.selected.id].plots, function(item) {
						return item.id==options.plot;
					});
				}
				
				//console.log("plot", plot.id);
				if (plot) {
					var settings = {};
					// Init the settings (from the type), set all the inputs to false
					if (chart && chart.type && chart.type.inputs) {
						_.each(chart.type.inputs, function(input) {
							settings[input.name] = input.value;
						});
					}
					// Init the settings (from the chart), set all the inputs to false
					if (chart && chart.inputs) {
						_.each(chart.inputs, function(input) {
							settings[input.name] = input.value;
						});
					}
					settings.name	= options.data.data.label;
					settings.color	= options.data.data.color||'#1E88E5';
					
					
					if (type=='605cb54dfb') { // Candlesticks
						// What port was just connected?
						var sources = {
							open:	true,
							high:	true,
							low:	true,
							close:	true
						}
						if (sources[options.data.data.id]) {
							// Connect all ports
							_.each(sources, function(v,src) {
								settings[src]	= options.data.data.box+':'+src;
							})
						}
					} else {
						settings.value	= options.data.data.box+':'+options.data.data.id;
					}
					
					
					
					settings.x		= 'd';
					
					var newChart = $scope.chart.addChart({
						plot:		plot.id,
						chart:		chart,
						settings:	settings
					});
					//console.log("newChart", newChart);
				}
				
			},
			isDragChartValid:	function() {
				return $scope.chart.dragBuffer.type;
			}
		}
		
		
		$scope.tabs	= {
			select:		function(tab) {
				if (!$scope.app || !$scope.app.tabs) {
					return false;
				}
				if ($scope.app.tabs.selected.id == tab.id) {
					return false;
				}
				$scope.app.tabs.selected	= tab;
				$timeout(function() {
					$scope.chart.refresh(tab.id);
				});
			},
			is:		function(id) {
				if (!$scope.app || !$scope.app.tabs) {
					return false;
				}
				return $scope.app.tabs.selected && $scope.app.tabs.selected.id	== id;
			},
			create:		function(label) {
				if (!$scope.app || !$scope.app.tabs) {
					return false;
				}
				
				// Create the tab
				var tab = {
					id:		'_' + Math.random().toString(36).substr(2, 9),
					label:	label?label:'Panel #'+($scope.app.tabs.tabs.length+1)
				};
				$scope.app.tabs.tabs.push(tab);
				
				// Create the chart
				$scope.app.charts[tab.id] = {
					plots: []
				}
				
				// Select the tab
				$scope.tabs.select(tab);
			},
			edit:		function(tab, status) {
				tab.editMode	 = status;
			},
			remove:		function(tab) {
				var c = confirm("Are you sure?");
				if (!c) {
					return false;
				}
				// Remove the tab
				$scope.app.tabs.tabs = _.filter($scope.app.tabs.tabs, function(item) {
					return item.id != tab.id;
				});
				// Remove the data
				delete $scope.app.charts[tab.id];
				$timeout(function() {
					$scope.safeApply(function() {});
				});
			}
		};
		
		
		// Szve the app data whenever it changes
		$scope.$watch('app', function(a, b) {
			if ($scope.app) {
				//console.log("CHANGE", a, b);
				sdk.send('save:app', $scope.app);
			}
		}, true);
		
		
		window.Arbiter.subscribe('color.changed', function() {
			$scope.chart.refresh($scope.app.tabs.selected.id);
		});
		window.Arbiter.subscribe('project.charting.chart.remove', function(chart) {
			//console.log("project.charting.chart.remove", chart);
			
			$scope.app.charts[$scope.app.tabs.selected.id].plots	= _.map($scope.app.charts[$scope.app.tabs.selected.id].plots, function(plot) {
				
				plot.charts	= _.filter(plot.charts, function(item) {
					return item.id != chart.id;
				});
				
				return plot;
			});
			
			$timeout(function() {
				$scope.chart.refresh($scope.app.tabs.selected.id);
			});
		});
		window.Arbiter.subscribe('project.charting.event.remove', function(payload) {
			//console.log("project.charting.event.remove", payload);
			$timeout(function() {
				$scope.chart.refresh($scope.app.tabs.selected.id);
			});
		});
	
		$scope.resize = function() {
			var sidebarHeight	= parseInt($(element).innerHeight());
			var tabHeight		= parseInt($('.chart-tabs').outerHeight());
			$scope.tabs.height	= tabHeight;
			
			$('.app-charts').css({
				height: sidebarHeight
			});
			$('.app-charts #container').css({
				height: sidebarHeight-tabHeight
			});
		}
		
		setInterval(function() {
			$scope.resize();
		}, 500);
		$timeout(function() {
			$scope.resize();
		});
		
		// Init the app when the SDK is loaded
		sdk.onInit(function() {
			$scope.chart.init();
		});
		
		// Refresh the charts when the datasets is updated
		sdk.onDatasetUpdate(function(datasets) {
			$scope.datasets = datasets;
			$scope.chart.refresh($scope.app.tabs.selected.id);
		});
		
		// Handle the port drag
		sdk.onDrag(function(eventType, data) {
			switch (eventType) {
				case "start":
					$('.chart-drop').show();
					//console.log("$('.chart-drop')",$('.chart-drop'));
					var overlays = $('.chart-drop>.drop');
					//console.log("portDragStart", data, overlays);
					overlays.each(function(idx, el) {
						$(el).removeClass("active");
					})
					//console.log("drag start!", data);
				break;
				case "move":
					var overlays = $('.chart-drop>.drop');
					//console.log("portDragMove",data, overlays);
					overlays.each(function(idx, el) {
						var elOffset = $(el).offset();
						var elW	= $(el).width();
						var elH	= $(el).height();
						if (data.end.left > elOffset.left && data.end.left < elOffset.left+elW && data.end.top > elOffset.top && data.end.top < elOffset.top+elH) {
							$(el).addClass("active");
						} else {
							$(el).removeClass("active");
						}
					})
				break;
				case "end":
					$('.chart-drop').hide();
					var overlays = $('.chart-drop>.drop');
					
					overlays.each(function(idx, el) {
						if ($(el).hasClass("active")) {
							//console.log("addFromDrop!!!",$(el).attr("plot"));
							$scope.chart.addFromDrop({
								plot:	$(el).attr("plot"),
								data:	data
							});
						}
						$(el).removeClass("active");
					})
					//console.log("drag end!", data);
				break;
			}
			
		});
		
		
		// Unsubscribe from all
		$scope.$on('$destroy', function() {
			clearInterval(boundItv);
		});
		
	};
	
	return {
		link: 			component,
		scope:			{
			
		},
		templateUrl:	'/js/app/app.html'
	};
}])


angular.module('app', ['quant-studio','ui.bootstrap.materialPicker','uic']).controller('main', function($scope, $locale) {});
