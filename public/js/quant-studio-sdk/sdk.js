
(function(window) {
	
	var sdk = {};
	
	/*
		TODO:
			onInit()
			onProjectChange
			onDatasetUpdate
	*/
	
	sdk = {
		loaded:		false,
		listener:	null,
		data:		{},
		callbacks:	{},
		cleanData:	function(input) {
			if (angular) {
				return JSON.parse(angular.toJson(input));
			} else {
				return JSON.parse(JSON.stringify(input));
			}
		},
		init:	function() {
			if (sdk.listener) {
				window.removeEventListener('message', sdk.listener);
			}
			sdk.listener = window.addEventListener('message', function(e) {
				//console.log("client message",e);
				sdk.handleIncomingMessage(e);
			});
		},
		sid:	function() {
			return Math.random().toString(36).substr(2, 9);
		},
		onInit:	function(callback) {
			if (sdk.loaded) {
				callback();
			} else {
				if (!sdk.callbacks.onInit) {
					sdk.callbacks.onInit = [];
				}
				sdk.callbacks.onInit.push(callback);
			}
		},
		onProjectChange:	function(callback) {
			if (!sdk.callbacks.onProjectChange) {
				sdk.callbacks.onProjectChange = {};
			}
			var id = sdk.sid();
			sdk.callbacks.onProjectChange[id] = callback;
			return {
				id:		id,
				stop:	function() {
					delete sdk.callbacks.onProjectChange[id];
				}
			};
		},
		onDatasetUpdate:	function(callback) {
			if (!sdk.callbacks.onDatasetUpdate) {
				sdk.callbacks.onDatasetUpdate = {};
			}
			var id = sdk.sid();
			sdk.callbacks.onDatasetUpdate[id] = callback;
			return {
				id:		id,
				stop:	function() {
					delete sdk.callbacks.onDatasetUpdate[id];
				}
			};
		},
		onDrag:	function(callback) {
			if (!sdk.callbacks.onDrag) {
				sdk.callbacks.onDrag = {};
			}
			var id = sdk.sid();
			sdk.callbacks.onDrag[id] = callback;
			return {
				id:		id,
				stop:	function() {
					delete sdk.callbacks.onDrag[id];
				}
			};
		},
		checkLoadingStatus:	function() {
			if (sdk.data.project && sdk.data.datasets && sdk.data.app && !sdk.loaded) {
				sdk.loaded	= true;
				if (sdk.callbacks.onInit && sdk.callbacks.onInit.length>0) {
					var execLoop = function(input) {
						var cb = input.pop();
						cb();
						if (input.length>0) {
							execLoop(input);
						}
					}
					execLoop(sdk.callbacks.onInit);
				}
			} else {
				sdk.loaded	= false;
			}
		},
		handleIncomingMessage:	function(event) {
			try {
				var payload = JSON.parse(event.data);
			} catch (e) {
				var payload = event.data;
			}
			
			var rawType		= payload.type;
			var dataPayload	= payload.payload;
			
			var typeParts	= rawType.split(':');
			if (typeParts.length!==2) {
				console.log("Invalid event", payload);
				return false;
			}
			var evtDomain	= typeParts[0];
			var evtType		= typeParts[1];
			
			//console.log(">> ", evtDomain, evtType);
			
			switch (evtDomain) {
				case "data":
					sdk.data[evtType] = dataPayload;
					sdk.checkLoadingStatus();
					if (evtType=='datasets') {
						_.each(sdk.callbacks.onDatasetUpdate, function(cb,k) {
							cb(sdk.data['datasets']);
						});
					}
					if (evtType=='project') {
						_.each(sdk.callbacks.onProjectChange, function(cb,k) {
							cb(sdk.data['project']);
						});
					}
				break;
				case "port-drag":
					_.each(sdk.callbacks.onDrag, function(cb,k) {
						cb(evtType, dataPayload);
					});
				break;
			}
			
			//console.log("Client received:", payload);
		},
		send:	function(type, payload) {
			var parts = type.split(':');
			switch (parts[0]) {
				case "save":
				if (!sdk.data.user_id) {
					console.log("Save not allowed, user not authenticated");
				}
				break;
			}
			//console.log("Client Send:", type, payload);
			window.parent.postMessage({
				type:		type,
				payload:	sdk.cleanData(payload)
			}, /*'http://localhost:274'*/'https://www.quant-studio.com'); //http://localhost:274
		}
	}
	
	sdk.init();
	
	window.sdk = sdk;
	
})(window)