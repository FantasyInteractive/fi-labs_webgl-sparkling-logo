// This lab is based upon the examples within sparks.js - https://github.com/zz85/sparks.js

var FI = FI || {};
FI.ParticleLogo = new function() {

  //  Internal vars
  var container      = document.getElementById('container'),
      me              = this,
      renderer        = null,
      scene           = null,
      camera          = null,
      parent          = null,
      composer        = null,
      width           = container.offsetWidth,
      height          = container.offsetWidth,
      aspect          = width / height;
      logoShape       = null,
      particleCloud   = null,
      sparksEmitter   = null,
      emitterPos      = null,
      attributes      = null,
      uniforms        = null,
      particles       = null,
      particleLifetime = null,
      acceleration    = null,
      wind            = null,
      Pool            = null,
      tween           = null,
      numberOfParticles  = 50000,
      timeOnShapePath = 0;


  /***
  #========================================
  # GUI - Vars used by dat.GUI
  #========================================
  ***/

  this.timeOnShapePath = 0.000001;

  this.hue = 0;

  this.windX = 0;
  this.windY = -1000;
  this.windZ = 0;

  this.randomDriftX = 30000;
  this.randomDriftY = 30000;
  this.randomDriftZ = 30000;

  this.lifetimeMax = 0;

  this.rotationSpeed = 0.07;

  /***
  #========================================
  # Initialize everything
  #========================================
  ***/

  this.init = function(){
    setupScene();
    setParticlePool();
    this.setupParticleSystem();

    // Stats and GUI
    displayStats();
    createGUI();

    initAnimationSequence();

    // Animate scene
    animate();
  }


  /***
  #========================================
  # Scene setup
  #========================================
  ***/

  function setupScene(){
    if(Detector.webgl){
      renderer = new THREE.WebGLRenderer({
        antialias   : true, // to get smoother output
        preserveDrawingBuffer : true  // to allow screenshot
      });
      renderer.setClearColorHex( 0x000000, 1 );
    }else{
       Detector.addGetWebGLMessage();
       return true;
    }

    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMapEnabled = this.shadowMapEnabled;

    container.appendChild(renderer.domElement);


    // create a scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, aspect, 1, 10000 );
    camera.position.set(0, 0, 3200);
    scene.add(camera);


    parent = new THREE.Object3D();
    scene.add(parent);

  }



  /***
  #========================================
  # Particle system setup
  #========================================
  ***/

  // Particle pool
  function setParticlePool() {

    particles = new THREE.Geometry();
    Pool = {
      __pools: [],

      // Get a new Vector
      get: function() {
        if (this.__pools.length>0) {
          return this.__pools.pop();
        }
        console.log("pool ran out!")
        return null;
      },

      // Release a vector back into the pool
      add: function(v) {
        this.__pools.push(v);
      },
    };

    for (i = 0; i < numberOfParticles; i++) {
        particles.vertices.push(newpos(Math.random() *200 - 100, Math.random() *100+150, Math.random() *50));
        Pool.add(i);
    }
  }


  // Particle system setup
  this.setupParticleSystem = function(){

    attributes = {
      size: { type: 'f', value: [] },
      ca: { type: 'c', value: [] }
    };

    var sprite = generateSprite() ;
    textu = new THREE.Texture ( sprite );
    textu.needsUpdate = true;

    uniforms = {
      amplitude: { type: "f", value: 1.0 },
      color:     { type: "c", value: new THREE.Color( 0xffffff ) },
      texture:   { type: "t", value: 0, texture:textu} //
    };

    var shaderMaterial = new THREE.ShaderMaterial( {

      uniforms: uniforms,
      attributes: attributes,
      vertexShader: document.getElementById( 'vertexshader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent:  true

    });

    particleCloud = new THREE.ParticleSystem( particles, shaderMaterial );

    particleCloud.dynamic = false;
    //particleCloud.sortParticles = true;

    var vertices = particleCloud.geometry.vertices;
    var values_size = attributes.size.value;
    var values_color = attributes.ca.value;

    for( var v = 0; v < vertices.length; v++ ) {
      values_size[v] = 50;
      values_color[v] = new THREE.Color( 0xaaff00 );
      values_color[v].setHSV( 0, 0, 0 );
      particles.vertices[v].position.set(Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    }

    parent.add( particleCloud );


    // Draw FI Logo
    var xoff = 0, yoff = 0;

    logoShape = new THREE.Shape();

    logoShape.moveTo( xoff + 130, yoff + 120 );

    logoShape.bezierCurveTo(187 + xoff, 63 + yoff, 229 + xoff, 139 + yoff, 289 + xoff, 139 + yoff);
    logoShape.bezierCurveTo(363 + xoff, 139 + yoff, 382 + xoff, 72 + yoff, 434 + xoff, 114 + yoff);
    logoShape.bezierCurveTo(494 + xoff, 162 + yoff, 419 + xoff, 192 + yoff, 420 + xoff, 250 + yoff);
    logoShape.bezierCurveTo(421 + xoff, 305 + yoff, 494 + xoff, 337 + yoff, 437 + xoff, 392 + yoff);
    logoShape.bezierCurveTo(389 + xoff, 439 + yoff, 362 + xoff, 375 + yoff, 289 + xoff, 372 + yoff);
    logoShape.bezierCurveTo(221 + xoff, 369 + yoff, 193 + xoff, 437 + yoff, 140 + xoff, 390 + yoff);
    logoShape.bezierCurveTo(85 + xoff, 341 + yoff, 155 + xoff, 317 + yoff, 157 + xoff, 255 + yoff);
    logoShape.bezierCurveTo(159 + xoff, 200 + yoff, 98 + xoff, 167 + yoff, 132 + xoff, 119 + yoff);



    // Setup callback functions
    var hue = 0;

    var setTargetParticle = function() {

      var target = Pool.get();
      values_size[target] = Math.random() * 200 + 100;
      return target;

    };

    var onParticleCreated = function(p) {
      var position = p.position;
      p.target.position = position;

      var target = p.target;
      if (target) {
        if(me.hue != 0){
          hue = me.hue;
        } else {
          hue += 0.0006;
          if (hue>1) hue-=1;
        }

        timeOnShapePath += me.timeOnShapePath;
        if (timeOnShapePath > 1) timeOnShapePath -= 1;
        var pointOnShape = logoShape.getPointAt(timeOnShapePath);

        emitterpos.x = pointOnShape.x * 5 - 1500;
        emitterpos.y = -pointOnShape.y * 5 + 1400;

        particles.vertices[target].position = p.position;

        values_color[target].setHSV(hue, 0.8, 0.5);

      };

    };

    var onParticleDead = function(particle) {
        var target = particle.target;
        if (target) {
          // Hide the particle
          values_color[target].setHSV(0, 0, 0);
          particles.vertices[target].position.set(Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);

          // Mark particle system as available by returning to pool
          Pool.add(particle.target);
        }

    };

    sparksEmitter = new SPARKS.Emitter(new SPARKS.SteadyCounter(600));

    emitterpos = new THREE.Vector3(0,0,0);

    sparksEmitter.addInitializer(new SPARKS.Position( new SPARKS.PointZone( emitterpos ) ) );
    sparksEmitter.addInitializer(new SPARKS.Target(null, setTargetParticle));


    sparksEmitter.addAction(new SPARKS.Move());
    sparksEmitter.addAction(new SPARKS.Age());
    me.addSparksEmitterActions();

    sparksEmitter.addCallback("created", onParticleCreated);
    sparksEmitter.addCallback("dead", onParticleDead);
    sparksEmitter.start();
  }


  // Add emitter sactions and initializers
  this.addSparksEmitterActions = function(){
    particleLifetime = new SPARKS.Lifetime(0, me.lifetimeMax);
    wind = new SPARKS.Velocity(new SPARKS.PointZone(new THREE.Vector3(me.windX,me.windY,me.windZ)));
    randomDrift = new SPARKS.RandomDrift(me.randomDriftX, me.randomDriftY, me.randomDriftZ);
    acceleration = new SPARKS.Accelerate(0,0,50)

    sparksEmitter.addInitializer(particleLifetime);
    sparksEmitter.addInitializer(wind);
    sparksEmitter.addAction(acceleration);
    sparksEmitter.addAction(randomDrift);
  }


  // Remove emitter sactions and initializers
  this.removeSparksEmitterActions = function() {
    sparksEmitter.removeInitializer(particleLifetime);
    sparksEmitter.removeInitializer(wind);
    sparksEmitter.removeAction(acceleration);
    sparksEmitter.removeAction(randomDrift);
  }


  // Post processing
  function postProcessing(){
    var shaderFocus = THREE.ShaderExtras[ "focus" ];
    var effectFocus = new THREE.ShaderPass( shaderFocus );

    var shaderBlur = THREE.ShaderExtras[ "triangleBlur" ];
    var effectBlur = new THREE.ShaderPass( shaderBlur, 'texture' );; //
    var blurAmount = 0.0020;
    effectBlur.uniforms['delta'].value = new THREE.Vector2(blurAmount,blurAmount);
    effectFocus.uniforms['sampleDistance'].value = 0.99; //0.94
    effectFocus.uniforms['waveFactor'].value = 0.002;  //0.00125

    var renderScene = new THREE.RenderPass( scene, camera );

    composer = new THREE.EffectComposer( renderer );
    composer.addPass( renderScene );
    composer.addPass( effectBlur ); // effectBlur  effectFocus

    effectBlur.renderToScreen = true;
    effectFocus.renderToScreen = true;

  }

  // animation loop
  function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
    TWEEN.update();

  }

  // render the scene
  function render() {

    particleCloud.geometry.__dirtyVertices = true;
    particleCloud.geometry.__dirtyColors = true;
    attributes.size.needsUpdate = true;
    attributes.ca.needsUpdate = true;

    parent.rotation.y +=  me.rotationSpeed;

    // Uncomment this if you want to use post processing
    //composer.render();

    renderer.render(scene, camera);
  }



  /***
  #========================================
  # Helper methods
  #========================================
  ***/
  function newpos(x, y, z) {
    return new THREE.Vertex(
      new THREE.Vector3(x, y, z)
    );
  }


  function generateSprite() {

    var canvas = document.createElement( 'canvas' );
    canvas.width = 128;
    canvas.height = 128;

    var context = canvas.getContext( '2d' );

    context.beginPath();
    context.arc(64, 64, 60, 0, Math.PI*2, false);
    context.closePath();

    context.lineWidth = 0.5; //0.05
    context.stroke();
    context.restore();
    var gradient = context.createRadialGradient( canvas.width /2, canvas.height /2, 0, canvas.width /2, canvas.height /2, canvas.width /2 );

    gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
    gradient.addColorStop( 0.2, 'rgba(255,255,255,1)' );
    //gradient.addColorStop( 0.6, 'rgba(200,200,200,1)' );
    gradient.addColorStop( 0.4, 'rgba(128,128,128,1)' );
    gradient.addColorStop( 1, 'rgba(0,0,0,1)' );


    context.fillStyle = gradient;

    context.fill();
    //var idata =context.getImageData(0, 0, canvas.width, canvas.height);
    //document.body.appendChild(canvas);
    return canvas;

  }


  /***
  #========================================
  # Animation sequence
  #========================================
  ***/

  function initAnimationSequence() {

    tween = new TWEEN.Tween(me)
      .to({
        timeOnShapePath: 0.001,
        hue: 0,
        randomDriftX: 50,
        randomDriftY: 50,
        randomDriftZ: 3000,
        windX: 0,
        windY: -50,
        windZ: 0,
        lifetimeMax: 5,
        rotationSpeed: 0.002

      }, 20000)
      .onUpdate(updateCallback)
      .start();
  }

  function updateCallback(){
    me.removeSparksEmitterActions();
    me.addSparksEmitterActions();
  }


  /***
  #========================================
  # Stats and GUI
  #========================================
  ***/

  // Stats.js setup (https://github.com/mrdoob/stats.js)
  function displayStats() {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );
  }


  // Dat.gui setup (http://code.google.com/p/dat-gui)
  function createGUI() {
    var gui = new dat.GUI()
        gui.close()
    // Drawing speed
    gui.add(FI.ParticleLogo, 'timeOnShapePath').name('Drawing speed').min(0.000001).max(0.006).step(0.000001).listen();


    // Hue
    gui.add(FI.ParticleLogo, 'hue').name('Hue').min(0).max(1).step(0.001);

    // Wind xyz
    gui.add(FI.ParticleLogo, 'windX').name('Wind X').min(-1000).max(1000).step(10).listen().onChange(function() {
      me.removeSparksEmitterActions();
      me.addSparksEmitterActions();
    });
    gui.add(FI.ParticleLogo, 'windY').name('Wind Y').min(-1000).max(1000).step(10).listen().onChange(function() {
      me.removeSparksEmitterActions();
      me.addSparksEmitterActions();
    });
    gui.add(FI.ParticleLogo, 'windZ').name('Wind Z').min(-1000).max(1000).step(10).listen().onChange(function() {
      me.removeSparksEmitterActions();
      me.addSparksEmitterActions();
    });


    // RandomDrift xyz
    gui.add(FI.ParticleLogo, 'randomDriftX').name('Random Drift X').min(-20000).max(20000).step(10).listen().onChange(function() {
      me.removeSparksEmitterActions();
      me.addSparksEmitterActions();
    });
    gui.add(FI.ParticleLogo, 'randomDriftY').name('Random Drift Y').min(-20000).max(20000).step(10).listen().onChange(function() {
      me.removeSparksEmitterActions();
      me.addSparksEmitterActions();
    });
    gui.add(FI.ParticleLogo, 'randomDriftZ').name('Random Drift Z').min(-20000).max(20000).step(10).listen().onChange(function() {
      me.removeSparksEmitterActions();
      me.addSparksEmitterActions();
    });


    // Particle lifetime
    gui.add(FI.ParticleLogo, 'lifetimeMax').name('Particle Lifetime Max').min(0).max(10).step(1).listen().onChange(function() {
      me.removeSparksEmitterActions();
      me.addSparksEmitterActions();
    });


    // Rotation speed
    gui.add(FI.ParticleLogo, 'rotationSpeed').name('Rotation speed').min(0).max(0.2).step(0.001).listen().onChange(function() {
      me.removeSparksEmitterActions();
      me.addSparksEmitterActions();
    });
  }
}

FI.ParticleLogo.init();

