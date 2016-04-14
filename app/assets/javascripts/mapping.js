// Basic namespace for some Util functions used in this js lib
var Utils = {
    // handles any javascript errors by popping a toast up at the top.
    handleError: function(error) {
        var jsonMsg = JSON.parse(error.responseText);
        toastr.error(jsonMsg.status + " : " + jsonMsg.message);
    },
    addComma: function (str) {
        return (str.match(/\,\s+$/) || str.match(/in\s+$/)) ? '' : ', ';
    },
    mqResultToString: function (addr) {
        // Convert a MapQuest reverse geocoding result to a human readable string.
        var out, county, town;
        if (!addr || !(addr.town || addr.county || addr.hamlet || addr.state || addr.country)) {
            return 'We are somewhere on earth..';
        }
        out = 'We are ';
        if (addr.city !== null) {
            out += 'in ' + addr.city;
        } else if (addr.town !== null) {
            out += 'in ' + addr.town;
        } else if (addr.hamlet !== null) {
            out += 'in ' + addr.hamlet;
        } else {
            out += 'somewhere in ';
        }
        out += Utils.addComma(out);
        if (addr.county) {
            if (addr.county.toLowerCase().indexOf('county') > -1) {
                out += addr.county;
            } else {
                out += addr.county + ' County';
            }
        }
        out += Utils.addComma(out);
        if (addr.state) {
            out += addr.state;
        }
        out += Utils.addComma(out);
        if (addr.country) {
            if (addr.country.indexOf('United States') > -1) {
                out += 'the ';
            }
                out += addr.country;
            }
        out += '.';
        return out;
    }
};

L.TileLayer.Common = L.TileLayer.extend({
    initialize: function (options) {
        L.TileLayer.prototype.initialize.call(this, this.url, options);
    }
});

// -- CUSTOM CONTROLS ----------------------------------
// Help control, when you click on this the help screen will overlay the map
L.Control.Help = L.Control.extend({
    options: {
        position: 'topright',
    },
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'mp-control mp-control-component');
        var control = L.DomUtil.create('a', 'fa fa-question fa-2x', container);
        control.href = "#";
        var text = L.DomUtil.create('span', '', container);
        text.innerHTML = " Help";
        L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation)
            .on(container, 'click', L.DomEvent.preventDefault)
            .on(container, 'click', function (e) { });
        return container;
    }
});

// Control panel for all the task functions
L.Control.ControlPanel = L.Control.extend({
    options: {
        position: 'bottomright',
        currentTaskId:-1,
        parent: {
            id:-1,
            blurb:'',
            instruction:'',
            difficulty:1
        },
        controls:[false, false, false, false],
        showText:true
    },
    onAdd: function(map) {
        // we create all the containers first so that the ordering will always be consistent
        // no matter what controls a user decides to put on the map
        var container = L.DomUtil.create('div', 'mp-control');
        container.id = "controlpanel_container";
        var prevDiv = L.DomUtil.create('div', 'mp-control-component pull-left', container);
        prevDiv.id = "controlpanel_previous";
        var editDiv = L.DomUtil.create('div', 'mp-control-component pull-left', container);
        editDiv.id = "controlpanel_edit";
        var fpDiv = L.DomUtil.create('div', 'mp-control-component pull-left', container);
        fpDiv.id = "controlpanel_fp";
        var nextDiv = L.DomUtil.create('div', 'mp-control-component pull-left', container);
        nextDiv.id = "controlpanel_next";
        return container;
    },
    // updates the parent and current task id that is being shown on the map
    update: function(props) {
        this.options.parent.id = props.parent.id;
        this.options.currentTaskId = props.currentTaskId;
    },
    // updates whether to show the text for the controls or not
    updateShowText: function(showText) {
        this.options.showText = showText;
    },
    // updates the controls, removes and adds if necessary
    updateUI: function(prevControl, editControl, fpControl, nextControl) {
        this.options.controls[0] = prevControl;
        this.options.controls[1] = editControl;
        this.options.controls[2] = fpControl;
        this.options.controls[3] = nextControl;
        this.updateControls();
    },
    // generic function to update the controls on the map
    updateControl: function(controlID, controlName, friendlyName, icon, clickHandler) {
        if (this.options.controls[controlID]) {
            var controlDiv = L.DomUtil.get(controlName);
            if (!controlDiv.hasChildNodes()) {
                var control = L.DomUtil.create('a', 'fa ' + icon + ' fa-2x', controlDiv);
                control.href = "#";
                var text = L.DomUtil.create('span', '', controlDiv);
                if (this.options.showText) {
                    text.innerHTML = " " + friendlyName;
                }
                L.DomEvent.on(controlDiv, 'click', L.DomEvent.stopPropagation)
                    .on(controlDiv, 'click', L.DomEvent.preventDefault)
                    .on(controlDiv, 'click', clickHandler);
            }
        } else {
            $("#" + controlName).innerHTML = "";
        }

    },
    updateControls: function() {
        this.updatePreviousControl();
        this.updateEditControl();
        this.updateFPControl();
        this.updateNextControl();
    },
    updatePreviousControl: function() {
        var self = this;
        this.updateControl(0, "controlpanel_previous", "Previous", "fa-backward", function(e) {
            jsRoutes.controllers.MappingController
                .getSequentialPreviousTask(self.options.parent.id, self.options.currentTaskId)
                .ajax({
                    success: function (data) {
                        self.options.currentTaskId = data.id;
                        MRManager.displayTaskData(data);
                    },
                    error: Utils.handleError
                });
        });
    },
    updateEditControl: function() {
        this.updateControl(1, "controlpanel_edit", "Edit", "fa-pencil", function(e) {
            $("#editoptions").fadeIn('slow');
        });
    },
    updateFPControl: function() {
        this.updateControl(2, "controlpanel_fp", "False Positive", "fa-warning", function(e) { });
    },
    updateNextControl: function() {
        var self = this;
        this.updateControl(3, "controlpanel_next", "Next", "fa-forward", function(e) {
            jsRoutes.controllers.MappingController
                .getSequentialNextTask(self.options.parent.id, self.options.currentTaskId)
                .ajax({
                    success:function(data) {
                        self.options.currentTaskId = data.id;
                        MRManager.displayTaskData(data);
                    },
                    error:Utils.handleError
                });
        });
    }
});
// -----------------------------------------------------

// add various basemap layers to the TileLayer namespace
(function () {

    var osmAttr = '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';

    L.TileLayer.CloudMade = L.TileLayer.Common.extend({
        url: 'http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png',
        options: {
            attribution: 'Map data ' + osmAttr + ', Imagery &copy; <a href="http://cloudmade.com">CloudMade</a>',
            styleId: 997
        }
    });

    L.TileLayer.OpenStreetMap = L.TileLayer.Common.extend({
        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {attribution: osmAttr}
    });

    L.TileLayer.OpenCycleMap = L.TileLayer.Common.extend({
        url: 'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png',
        options: {
            attribution: '&copy; OpenCycleMap, ' + 'Map data ' + osmAttr
        }
    });

    var mqTilesAttr = 'Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" />';

    L.TileLayer.MapQuestOSM = L.TileLayer.Common.extend({
        url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.png',
        options: {
            subdomains: '1234',
            type: 'osm',
            attribution: 'Map data ' + L.TileLayer.OSM_ATTR + ', ' + mqTilesAttr
        }
    });

    L.TileLayer.MapQuestAerial = L.TileLayer.MapQuestOSM.extend({
        options: {
            type: 'sat',
            attribution: 'Imagery &copy; NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency, ' + mqTilesAttr
        }
    });

    L.TileLayer.MapBox = L.TileLayer.Common.extend({
        url: 'http://{s}.tiles.mapbox.com/v3/{user}.{map}/{z}/{x}/{y}.png'
    });

    L.TileLayer.Bing = L.TileLayer.Common.extend({
        url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

}());

// A simple point class
var Point = function(x, y) {
    this.x = x;
    this.y = y;
};

var MRManager = (function() {
    var map;
    var geojsonLayer;
    var layerControl;
    // controls
    var controlPanel = new L.Control.ControlPanel({});
    var currentTask = {};
    // In debug mode tasks will not be edited and the previous button is displayed in the control panel
    var debugMode = false;

    // Function that handles the resizing of the map when the menu is toggled
    var resizeMap = function() {
        var mapDiv = $("#map");
        var notifications = $(".notification-position");
        var menuOpenNotifications = $(".notification-position-menuopen");
        var sidebarWidth = $("#sidebar").width();
        if (sidebarWidth == 50) {
            mapDiv.animate({left: '230px'});
            notifications.animate({left: '270px'});
            menuOpenNotifications.animate({left: '270px'});
        } else if (sidebarWidth == 230) {
            mapDiv.animate({left: '50px'});
            notifications.animate({left: '90px'});
            menuOpenNotifications.animate({left: '90px'});
        }
    };

    var init = function (element, point) {
        var osm_layer = new L.TileLayer.OpenStreetMap(),
            road_layer = new L.TileLayer.MapQuestOSM(),
            mapquest_layer = new L.TileLayer.MapQuestAerial(),
            opencycle_layer = new L.TileLayer.OpenCycleMap(),
            bing_layer = new L.TileLayer.Bing();
        map = new L.Map(element, {
            center: new L.LatLng(point.x, point.y),
            zoom: 13,
            layers: [
                osm_layer
            ]
        });

        geojsonLayer = new L.GeoJSON(null, {
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    var counter = 0;
                    var popupString = '<div class="popup">';
                    for (var k in feature.properties) {
                        counter++;
                        var v = feature.properties[k];
                        popupString += k + ': ' + v + '<br />';
                    }
                    popupString += '</div>';
                    if (counter > 0) {
                        layer.bindPopup(popupString, {
                            maxHeight: 200
                        });
                    }
                }
            }
        });

        map.addLayer(geojsonLayer);
        layerControl = L.control.layers(
            {'OSM': osm_layer, 'Open Cycle': opencycle_layer, 'MapQuest Roads': road_layer,
                'MapQuest': mapquest_layer, 'Bing': bing_layer},
            {'GeoJSON': geojsonLayer},
            {position:"topright"}
        );
        map.addControl(new L.Control.Help({}));
        map.addControl(layerControl);
        map.addControl(controlPanel);

        // handles click events that are executed when submitting the custom geojson from the geojson viewer
        $('#geojson_submit').on('click', function() {
            if ($('#geojson_text').val().length < 1) {
                $('#geoJsonViewer').modal("hide");
                return;
            }
            geojsonLayer.clearLayers();
            geojsonLayer.addData(JSON.parse($('#geojson_text').val()));
            map.fitBounds(geojsonLayer.getBounds());
            $('#geoJsonViewer').modal("hide");
        });
        // handles the click event from the sidebar toggle
        $("#sidebar_toggle").on("click", resizeMap);
        $("#map").css("left", $("#sidebar").width());
    };

    var displayTaskData = function(data) {
        geojsonLayer.clearLayers();
        geojsonLayer.addData(data.geometry);
        map.fitBounds(geojsonLayer.getBounds());
        controlPanel.update({
            parent:{id:data.parentId},
            currentTaskId:data.id
        });
        controlPanel.updateUI(true, true, true, true);
        // show the task text as a notification
        toastr.clear();
        toastr.info(data.instruction, '', { positionClass: getNotificationClass(), timeOut: 0 });
        // let the user know where they are
        displayAdminArea();
    };

    var getNotificationClass = function() {
        if ($("#sidebar").width() == 50) {
            return 'notification-position';
        } else {
            return 'notification-position-menuopen';
        }
    };

    var displayAdminArea = function () {
        var mqurl = 'http://open.mapquestapi.com/nominatim/v1/reverse.php?key=Nj8oRSldMF8mjcsqp2JtTIcYHTDMDMuq&format=json&lat=' + map.getCenter().lat + '&lon=' + map.getCenter().lng;
        $.ajax({
            url: mqurl,
            jsonp: "json_callback",
            success: function (data) {
                toastr.info(Utils.mqResultToString(data.address), '', {positionClass: getNotificationClass()});
            }
        });
    };

    // adds a task (or challenge) to the map
    var addTaskToMap = function(parentId, taskId) {
        if (parentId != -1) {
            if (taskId != -1) {
                jsRoutes.controllers.MappingController.getTaskDisplayGeoJSON(taskId).ajax({
                    success:function(data) {
                        currentTask = data;
                        displayTaskData(data);
                    },
                    error:Utils.handleError
                });
            } else {
                
            }
        }
    };

    var getCurrentChallenge = function() {
        return currentTask.parent;
    };

    // registers a series of hotkeys for quick access to functions
    var registerHotKeys = function() {
        $(document).keydown(function(e) {
            e.preventDefault();
            switch(e.keyCode) {
                case 81: //q
                    // Get next task, set current task to false positive
                    break;
                case 87: //w
                    // Get next task, skip current task
                    break;
                case 69: //e
                    // open task in ID
                    break;
                case 82: //r
                    // open task in JSOM in current layer
                    break;
                case 84: //y
                    // open task in JSOM in new layer
                    break;
                case 27: //esc
                    // remove open dialog
                    break;
                default:
                    break;
            }
        });
    };

    return {
        init: init,
        addTaskToMap: addTaskToMap,
        displayTaskData: displayTaskData
    };

}());
