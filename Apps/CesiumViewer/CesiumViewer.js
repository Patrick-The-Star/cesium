/*global define*/
define([
        'DynamicScene/CzmlDataSource',
        'Scene/PerformanceDisplay',
        'Core/Color',
        'Core/Math',
        'Core/Cartographic',
        'Core/Cartesian3',
        'Core/Matrix4',
        'Core/Ellipsoid',
        'Core/Extent',
        'Core/Geometry',
        'Core/GeometryAttribute',
        'Core/GeometryInstance',
        'Core/ExtentGeometry',
        'Core/EllipseGeometry',
        'Core/EllipsoidGeometry',
        'Core/PolygonGeometry',
        'Core/BoxGeometry',
        'Core/GeometryPipeline',
        'Core/VertexFormat',
        'Core/Transforms',
        'Core/PrimitiveType',
        'Core/ComponentDatatype',
        'Core/ScreenSpaceEventHandler',
        'Core/ScreenSpaceEventType',
        'Core/WallGeometry',
        'Scene/Primitive',
        'Scene/Appearance',
        'Scene/ClosedTranslucentAppearance',
        'Scene/PerInstanceColorClosedTranslucentAppearance',
        'Scene/EllipsoidSurfaceAppearance',
        'Scene/Material',
        'Widgets/checkForChromeFrame',
        'Widgets/Viewer/Viewer',
        'Widgets/Viewer/viewerDragDropMixin',
        'Widgets/Viewer/viewerDynamicObjectMixin',
        'domReady!'
    ], function(
        CzmlDataSource,
        PerformanceDisplay,
        Color,
        CesiumMath,
        Cartographic,
        Cartesian3,
        Matrix4,
        Ellipsoid,
        Extent,
        Geometry,
        GeometryAttribute,
        GeometryInstance,
        ExtentGeometry,
        EllipseGeometry,
        EllipsoidGeometry,
        PolygonGeometry,
        BoxGeometry,
        GeometryPipeline,
        VertexFormat,
        Transforms,
        PrimitiveType,
        ComponentDatatype,
        ScreenSpaceEventHandler,
        ScreenSpaceEventType,
        WallGeometry,
        Primitive,
        Appearance,
        ClosedTranslucentAppearance,
        PerInstanceColorClosedTranslucentAppearance,
        EllipsoidSurfaceAppearance,
        Material,
        checkForChromeFrame,
        Viewer,
        viewerDragDropMixin,
        viewerDynamicObjectMixin) {
    "use strict";
    /*global console*/

    /*
     * 'debug'  : true/false,   // Full WebGL error reporting at substantial performance cost.
     * 'lookAt' : CZML id,      // The CZML ID of the object to track at startup.
     * 'source' : 'file.czml',  // The relative URL of the CZML file to load at startup.
     * 'stats'  : true,         // Enable the FPS performance display.
     * 'theme'  : 'lighter',    // Use the dark-text-on-light-background theme.
     */
    var endUserOptions = {};
    var queryString = window.location.search.substring(1);
    if (queryString !== '') {
        var params = queryString.split('&');
        for ( var i = 0, len = params.length; i < len; ++i) {
            var param = params[i];
            var keyValuePair = param.split('=');
            if (keyValuePair.length > 1) {
                endUserOptions[keyValuePair[0]] = decodeURIComponent(keyValuePair[1].replace(/\+/g, ' '));
            }
        }
    }

    var loadingIndicator = document.getElementById('loadingIndicator');

    checkForChromeFrame('cesiumContainer').then(function(prompting) {
        if (!prompting) {
            startup();
        } else {
            loadingIndicator.style.display = 'none';
        }
    });

    function startup() {
        var viewer = new Viewer('cesiumContainer');
        viewer.extend(viewerDragDropMixin);
        viewer.extend(viewerDynamicObjectMixin);

        viewer.onDropError.addEventListener(function(dropHandler, name, error) {
            console.log(error);
            window.alert(error);
        });

        var scene = viewer.scene;
        var context = scene.getContext();
        if (endUserOptions.debug) {
            context.setValidateShaderProgram(true);
            context.setValidateFramebuffer(true);
            context.setLogShaderCompilation(true);
            context.setThrowOnWebGLError(true);
        }

        if (typeof endUserOptions.source !== 'undefined') {
            var source = new CzmlDataSource();
            source.loadUrl(endUserOptions.source).then(function() {
                viewer.dataSources.add(source);

                var dataClock = source.getClock();
                if (typeof dataClock !== 'undefined') {
                    dataClock.clone(viewer.clock);
                    viewer.timeline.updateFromClock();
                    viewer.timeline.zoomTo(dataClock.startTime, dataClock.stopTime);
                }

                if (typeof endUserOptions.lookAt !== 'undefined') {
                    var dynamicObject = source.getDynamicObjectCollection().getObject(endUserOptions.lookAt);
                    if (typeof dynamicObject !== 'undefined') {
                        viewer.trackedObject = dynamicObject;
                    } else {
                        window.alert('No object with id ' + endUserOptions.lookAt + ' exists in the provided source.');
                    }
                }
            }, function(e) {
                window.alert(e);
            }).always(function() {
                loadingIndicator.style.display = 'none';
            });
        } else {
            loadingIndicator.style.display = 'none';
        }

        if (endUserOptions.stats) {
            scene.getPrimitives().add(new PerformanceDisplay());
        }

        var theme = endUserOptions.theme;
        if (typeof theme !== 'undefined') {
            if (endUserOptions.theme === 'lighter') {
                document.body.classList.add('cesium-lighter');
                viewer.animation.applyThemeChanges();
            } else {
                window.alert('Unknown theme: ' + theme);
            }
        }





        var ellipsoid = viewer.centralBody.getEllipsoid();

        var geometry = new GeometryInstance({
            geometry : new ExtentGeometry({
                vertexFormat : VertexFormat.POSITION_AND_NORMAL,
                extent : new Extent(
                    CesiumMath.toRadians(-180.0),
                    CesiumMath.toRadians(50.0),
                    CesiumMath.toRadians(180.0),
                    CesiumMath.toRadians(90.0)),
                granularity : 0.006                     // More than 64K vertices
            }),
            pickData : 'geometry',
            color : Color.CORNFLOWERBLUE
        });
        var geometry2 = new GeometryInstance({
            geometry : new EllipsoidGeometry({
                vertexFormat : VertexFormat.POSITION_AND_NORMAL,
                ellipsoid : new Ellipsoid(500000.0, 500000.0, 1000000.0)
            }),
            modelMatrix : Matrix4.multiplyByTranslation(Transforms.eastNorthUpToFixedFrame(
                ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-95.59777, 40.03883))), new Cartesian3(0.0, 0.0, 500000.0)),
            pickData : 'geometry2',
            color : Color.AQUAMARINE.clone()
        });
        geometry2.color.alpha = 0.5;
        var geometry3 = new GeometryInstance({
            geometry : new BoxGeometry({
                vertexFormat : VertexFormat.POSITION_AND_NORMAL,
                dimensions : new Cartesian3(1000000.0, 1000000.0, 2000000.0)
            }),
            modelMatrix : Matrix4.multiplyByTranslation(Transforms.eastNorthUpToFixedFrame(
                ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-75.59777, 40.03883))), new Cartesian3(0.0, 0.0, 3000000.0)),
            pickData : 'geometry3',
            color : Color.BLANCHEDALMOND
        });
        var geometry4 = new GeometryInstance({
            geometry : new EllipseGeometry({
                vertexFormat : VertexFormat.POSITION_AND_NORMAL,
                ellipsoid : ellipsoid,
                center : ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-100, 20)),
                semiMinorAxis : 500000.0,
                semiMajorAxis : 1000000.0,
                bearing : CesiumMath.PI_OVER_FOUR,
                height : 1000000.0
            }),
            pickData : 'geometry4',
            color : new Color(1.0, 1.0, 0.0, 0.5)
        });
        var primitive = new Primitive({
            geometryInstances : [geometry, geometry2, geometry3, geometry4],
            appearance : new PerInstanceColorClosedTranslucentAppearance()
        });
        scene.getPrimitives().add(primitive);

        var m = new Material({
            context : viewer.scene.getContext(),
            fabric : {
                materials : {
                    diffuseMaterial : {
                        type : 'DiffuseMap',
                        uniforms : {
                            image : '../Sandcastle/images/bumpmap.png'
                        }
                    },
                    normalMap : {
                        type : 'NormalMap',
                        uniforms : {
                            image : '../Sandcastle/images/normalmap.png',
                            strength : 0.6
                        }
                    }
                },
                components : {
                    diffuse : 'diffuseMaterial.diffuse',
                    specular : 0.01,
                    normal : 'normalMap.normal'
                }
            }
        });
        var rs = {
            depthTest : {
                enabled : true
            }
        };
        var appearance = new Appearance({
            material : m,
            renderState : rs
        });
        var geometry5 = new GeometryInstance({
            geometry : new EllipsoidGeometry({
                vertexFormat : VertexFormat.ALL,
                ellipsoid : new Ellipsoid(1000000.0, 500000.0, 500000.0)
            }),
            modelMatrix : Matrix4.multiplyByTranslation(Transforms.eastNorthUpToFixedFrame(
                ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-75.59777, 40.03883))), new Cartesian3(0.0, 0.0, 4500000.0)),
            pickData : 'geometry5'
        });
        scene.getPrimitives().add(new Primitive({
            geometryInstances : geometry5,
            appearance :appearance,
            vertexCacheOptimize : false,
            releasegeometryInstances : true,
            transformToWorldCoordinates : false
        }));

        var polygonGeometry = new GeometryInstance({
            geometry : new PolygonGeometry({
                vertexFormat : VertexFormat.POSITION_AND_ST,
/*
                positions : ellipsoid.cartographicArrayToCartesianArray([
                    Cartographic.fromDegrees(-72.0, 40.0),
                    Cartographic.fromDegrees(-70.0, 35.0),
                    Cartographic.fromDegrees(-75.0, 30.0),
                    Cartographic.fromDegrees(-70.0, 30.0),
                    Cartographic.fromDegrees(-68.0, 40.0)
                ]),
*/
                polygonHierarchy : {
                    positions : ellipsoid.cartographicArrayToCartesianArray([
                        Cartographic.fromDegrees(-109.0, 30.0),
                        Cartographic.fromDegrees(-95.0, 30.0),
                        Cartographic.fromDegrees(-95.0, 40.0),
                        Cartographic.fromDegrees(-109.0, 40.0)
                    ]),
                    holes : [{
                        positions : ellipsoid.cartographicArrayToCartesianArray([
                            Cartographic.fromDegrees(-107.0, 31.0),
                            Cartographic.fromDegrees(-107.0, 39.0),
                            Cartographic.fromDegrees(-97.0, 39.0),
                            Cartographic.fromDegrees(-97.0, 31.0)
                        ]),
                        holes : [{
                            positions : ellipsoid.cartographicArrayToCartesianArray([
                                Cartographic.fromDegrees(-105.0, 33.0),
                                Cartographic.fromDegrees(-99.0, 33.0),
                                Cartographic.fromDegrees(-99.0, 37.0),
                                Cartographic.fromDegrees(-105.0, 37.0)
                                ]),
                            holes : [{
                                positions : ellipsoid.cartographicArrayToCartesianArray([
                                    Cartographic.fromDegrees(-103.0, 34.0),
                                    Cartographic.fromDegrees(-101.0, 34.0),
                                    Cartographic.fromDegrees(-101.0, 36.0),
                                    Cartographic.fromDegrees(-103.0, 36.0)
                                ])
                            }]
                        }]
                    }]
                },
                stRotation : 0.523598776
            }),
            pickData : 'polygon3'
        });
        scene.getPrimitives().add(new Primitive({
            geometryInstances : polygonGeometry,
            appearance : new EllipsoidSurfaceAppearance({
                material : Material.fromType(scene.getContext(), 'Stripe')
            })
        }));

        var wall = new GeometryInstance({
            geometry : new WallGeometry({
                vertexFormat : VertexFormat.ALL,
                positions    : ellipsoid.cartographicArrayToCartesianArray([
                    Cartographic.fromDegrees(-125.0, 37.0, 100000.0),
                    Cartographic.fromDegrees(-125.0, 38.0, 100000.0),
                    Cartographic.fromDegrees(-120.0, 38.0, 100000.0),
                    Cartographic.fromDegrees(-120.0, 37.0, 100000.0),
                    Cartographic.fromDegrees(-125.0, 37.0, 100000.0)
                ])
            }),
            pickData : 'wall'
        });
        scene.getPrimitives().add(new Primitive({
            geometryInstances : wall,
            appearance : new Appearance({
                material : Material.fromType(scene.getContext(), 'Wood'),
                renderState : {
                    depthTest : {
                        enabled : true
                    }
                }
            })
        }));

        var customWithIndices = new GeometryInstance({
           geometry : new Geometry({
               attributes : {
                   position : new GeometryAttribute({
                        componentDatatype : ComponentDatatype.DOUBLE,
                        componentsPerAttribute : 3,
                        values : new Float64Array([
                            0.0, 0.0, 2000000.0,
                            7500000.0, 0.0, 2000000.0,
                            0.0, 7500000.0, 2000000.0
                        ])
                   })
               },
               indices : new Uint16Array([0, 1, 1, 2, 2, 0]),
               primitiveType : PrimitiveType.LINES
           }),
           pickData : 'customWithIndices'
        });
        scene.getPrimitives().add(new Primitive({
            geometryInstances : customWithIndices,
            appearance : new Appearance()
        }));

        var customWithoutIndices = new GeometryInstance({
            geometry : new Geometry({
                attributes : {
                    position : new GeometryAttribute({
                         componentDatatype : ComponentDatatype.DOUBLE,
                         componentsPerAttribute : 3,
                         values : new Float64Array([
                             0.0, 0.0, 0.0,
                             7500000.0, 0.0, 0.0,
                             0.0, 7500000.0, 0.0
                         ])
                    })
                },
                primitiveType : PrimitiveType.LINE_LOOP
            }),
            pickData : 'customWithoutIndices'
         });
         scene.getPrimitives().add(new Primitive({
             geometryInstances : customWithoutIndices,
             appearance : new Appearance()
         }));

        var handler = new ScreenSpaceEventHandler(scene.getCanvas());
        handler.setInputAction(
            function (movement) {
                var pickedObject = scene.pick(movement.endPosition);
                if (typeof pickedObject !== 'undefined') {
                    console.log(pickedObject);
                }
            },
            ScreenSpaceEventType.MOUSE_MOVE
        );

    }
});
