/*Tipos de bloque de la plataforma, no hay bloque dado que no se puede pisar ni hay 
superficie ahí (define el "hueco" de la pirámide y los bordes de cada fila)*/
let TIPO_VACIO = 0; 
let TIPO_ROJO = 1;
let TIPO_VERDE = 2;
let TIPO_GRIS_CLARO = 3;
let TIPO_GRIS_OSCURO = 4;

//Estados de pantalla (identificadores de la máquina de estados)
let ESTADO_MENU = 0;
let ESTADO_INSTRUCCIONES = 1;
let ESTADO_CREDITOS = 2;
let ESTADO_JUEGO = 3;
let ESTADO_PUNTAJES = 4;

//clave con la que se guardan los puntajes recientes en localStorage
let CLAVE_PUNTAJES = "umbral_puntajesRecientes";

//Objeto principal del juego
let juego;

//Referencia al canvas, para poder pedirle pantalla completa a él y no a toda la página
let lienzo;

//Variables para cargar los archivos:
let musica, interceptar, meteorito, muerteSer, fuenteBoton, fuenteCuadro, alertaIcono, astroIcono, 
meteoritoIcono, musicaEncenderIcono, musicaApagarIcono, pantallaCompletaIcono, pantallaIncompletaIcono, 
relojIcono, saludIcono, miraIcono;

//estrellas del fondo procedural, generadas una sola vez en setup()
let estrellas = [];


//control para evitar saturar el motor de audio con impactos de meteoritos casi simultáneos
let frameUltimoSonidoMeteorito = -10;

//control para el efecto de interferencia en la música cuando el astronauta está atrapado
let interferenciaActiva = false;
let frameUltimoCorteInterferencia = 0;

//control para el efecto visual del disparo
let disparoX = 0;
let disparoY = 0;
let frameDisparo = 0;

/*Control de teclado propio (no depende de keyIsDown de p5): se registra en fase de
captura sobre window, así el preventDefault llega antes que cualquier otro manejador
de la página que pudiera estar comiéndose el evento.*/
let teclaIzquierdaPresionada = false;
let teclaDerechaPresionada = false;
let teclaArribaPresionada = false;
let teclaAbajoPresionada = false;

window.addEventListener("keydown", function(evento_) 
{
  if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
  {
    getAudioContext().resume();
  }

  if (evento_.code == "ArrowLeft" || evento_.code == "ArrowRight" || evento_.code == "ArrowUp" || 
  evento_.code == "ArrowDown") 
  {
    evento_.preventDefault();
  }
  if (evento_.code == "ArrowLeft") 
  {
    teclaIzquierdaPresionada = true;
  }
  if (evento_.code == "ArrowRight") 
  {
    teclaDerechaPresionada = true;
  }
  if (evento_.code == "ArrowUp") 
  {
    teclaArribaPresionada = true;
  }
  if (evento_.code == "ArrowDown") 
  {
    teclaAbajoPresionada = true;
  }
}, true);

window.addEventListener("keyup", function(evento_) 
{
  if (evento_.code == "ArrowLeft") 
  {
    teclaIzquierdaPresionada = false;
  }
  if (evento_.code == "ArrowRight") 
  {
    teclaDerechaPresionada = false;
  }
  if (evento_.code == "ArrowUp") 
  {
    teclaArribaPresionada = false;
  }
  if (evento_.code == "ArrowDown") 
  {
    teclaAbajoPresionada = false;
  }
}, true);

/*si la ventana pierde el foco (por ejemplo con Alt+Tab), se liberan las teclas para 
que el personaje no quede moviéndose solo y se suspende el audio para evitar buffer underruns*/
window.addEventListener("blur", function() 
{
  teclaIzquierdaPresionada = false;
  teclaDerechaPresionada = false;
  teclaArribaPresionada = false;
  teclaAbajoPresionada = false;

  if (typeof getAudioContext == "function" && getAudioContext().state == "running") 
  {
    getAudioContext().suspend();
  }
});

/*si el navegador suspende el audio al cambiar de pestaña o salir de pantalla completa, 
se reanuda automáticamente al volver a la ventana con el búfer limpio*/
window.addEventListener("focus", function() 
{
  if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
  {
    getAudioContext().resume();
  }
});

document.addEventListener("visibilitychange", function() 
{
  if (document.visibilityState == "visible") 
  {
    if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
    {
      getAudioContext().resume();
    }
  } 
  else 
  {
    if (typeof getAudioContext == "function" && getAudioContext().state == "running") 
    {
      getAudioContext().suspend();
    }
  }
});

/*si se sale o entra de pantalla completa (sea por nuestro botón, ESC o el navegador),
el canvas sincroniza su tamaño y se asegura de que el audio siga activo*/
document.addEventListener("fullscreenchange", function() 
{
  if (document.fullscreenElement == null) 
  {
    lienzo.elt.style.width = "";
    lienzo.elt.style.height = "";
  } 
  else 
  {
    lienzo.elt.style.width = "100vw";
    lienzo.elt.style.height = "100vh";
  }

  if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
  {
    getAudioContext().resume();
  }
});

function preload() 
{
  musica = loadSound("assets/musica.mp3");
  interceptar = loadSound("assets/desviar-meteorito.mp3");
  meteorito = loadSound("assets/crater-bloque.mp3");
  muerteSer = loadSound("assets/meteorito-muerte.mp3");

  fuenteBoton = loadFont("assets/Montserrat-Medium.ttf");
  fuenteCuadro = loadFont("assets/Montserrat-Regular.ttf");

  alertaIcono = loadImage("assets/alerta.png", "Ícono de un triángulo con signo de exclamación");
  astroIcono = loadImage("assets/astronauta.png", "Ícono del casco de un Astronauta con visor");
  meteoritoIcono = loadImage("assets/meteorito.png", "Ícono de un asteroide simple");
  musicaEncenderIcono = loadImage("assets/musica-encender.png", "Ícono de una nota musical");
  musicaApagarIcono = loadImage("assets/musica-apagar.png", "Ícono de una nota musical tachada");
  pantallaCompletaIcono = loadImage("assets/pantalla-completa.png", "Ícono de 4 flechas apuntando hacia el exterior");
  pantallaIncompletaIcono = loadImage("assets/pantalla-incompleta.png", "Ícono de 4 flechas apuntando hacia el interior");
  relojIcono = loadImage("assets/reloj.png", "Ícono de un reloj con botón superior");
  saludIcono = loadImage("assets/salud.png", "Ícono de un círculo con un signo más");
  miraIcono = loadImage("assets/telescopio.png", "Ícono de un telescopio con vista lateral");
}

function setup() 
{
  lienzo = createCanvas(1280, 720).parent('contenedorCanva');
  noCursor();

  inicializarColoresBloques();
  inicializarColoresBotones();
  inicializarInstrucciones();
  generarEstrellas();
  generarNebulosas();
  generarViñeta();
  crearBufferNebulosa();
  crearBufferEstrellas();
  redibujarNebulosa();
  redibujarEstrellas();

  outputVolume(0.7);
  musica.setLoop(true);
  musica.amp(0.3);
  meteorito.amp(0.35);
  interceptar.amp(0.3);
  muerteSer.amp(0.6);

  juego = new Juego();
}

/*viñeta: degradé radial real generado una sola vez (vía drawingContext, el 
contexto 2D nativo del canvas), que oscurece las esquinas como en una foto astronómica*/
let gradienteViñeta;

function generarViñeta() 
{
  gradienteViñeta = drawingContext.createRadialGradient(width / 2, height / 2, height * 0.32, 
  width / 2, height / 2, height * 0.85);
  gradienteViñeta.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradienteViñeta.addColorStop(1, "rgba(0, 0, 0, 0.55)");
}

function dibujarViñeta() 
{
  drawingContext.fillStyle = gradienteViñeta;
  drawingContext.fillRect(0, 0, width, height);
}

/*genera las estrellas del fondo una sola vez: cuatro capas (polvo, lejana, media, cercana) con 
distinto tamaño y brillo, para reforzar la sensación de profundidad. Se generan un poco más 
allá de los bordes del canvas (por eso el -40/+40) para que la deriva automática (ver 
dibujarEstrellas) nunca deje ver un borde vacío*/
function generarEstrellas() 
{
  /*capa de polvo: muchísimas estrellas diminutas y muy tenues, para la densidad de fondo que se 
  ve en fotos reales (sin esto, el cielo queda con muy pocas luces). Bajada de 900 a 450: sigue 
  dando densidad de fondo pero son 450 ellipse() menos por frame*/
  for (let i = 0; i < 450; i = i + 1) 
  {
    let rRojo = floor(random(210, 255));
    let rVerde = floor(random(210, 255));
    let rAzul = floor(random(225, 255));

    estrellas.push
    ({
      x: random(-40, width + 40),
      y: random(-40, height + 40),
      radio: random(0.3, 0.7),
      fase: random(0, TWO_PI),
      velocidad: random(0.015, 0.04),
      brilloMin: random(6, 18),
      brilloMax: random(35, 65),
      colorEstilo: "rgb(" + rRojo + "," + rVerde + "," + rAzul + ")",
      capa: "polvo"
    });
  }

  for (let i = 0; i < 320; i = i + 1) 
  {
    let rRojo = floor(random(210, 255));
    let rVerde = floor(random(210, 255));
    let rAzul = floor(random(225, 255));

    estrellas.push
    ({
      x: random(-40, width + 40),
      y: random(-40, height + 40),
      radio: random(0.6, 1.3),
      fase: random(0, TWO_PI),
      velocidad: random(0.02, 0.05),
      brilloMin: random(15, 45),
      brilloMax: random(90, 150),
      colorEstilo: "rgb(" + rRojo + "," + rVerde + "," + rAzul + ")",
      capa: "lejana"
    });
  }

  for (let i = 0; i < 110; i = i + 1) 
  {
    let rRojo = floor(random(210, 255));
    let rVerde = floor(random(210, 255));
    let rAzul = floor(random(225, 255));

    estrellas.push
    ({
      x: random(-40, width + 40),
      y: random(-40, height + 40),
      radio: random(1.2, 2.0),
      fase: random(0, TWO_PI),
      velocidad: random(0.025, 0.06),
      brilloMin: random(50, 90),
      brilloMax: random(160, 210),
      colorEstilo: "rgb(" + rRojo + "," + rVerde + "," + rAzul + ")",
      capa: "media"
    });
  }

  /*muy pocas estrellas "cercanas", y de esas, solo un puñado bastante más brillante que el resto. 
  Las "destacadas" son directamente más brillantes y más grandes.*/
  for (let i = 0; i < 35; i = i + 1) 
  {
    let esDestacada = random(0, 1) < 0.2;
    let rRojo = floor(random(215, 255));
    let rVerde = floor(random(215, 255));
    let rAzul = floor(random(230, 255));

    estrellas.push({
      x: random(-40, width + 40),
      y: random(-40, height + 40),
      radio: esDestacada ? random(2.2, 3.0) : random(1.4, 2.0),
      fase: random(0, TWO_PI),
      velocidad: random(0.02, 0.045),
      brilloMin: esDestacada ? random(80, 110) : random(40, 70),
      brilloMax: esDestacada ? random(235, 255) : random(150, 190),
      colorEstilo: "rgb(" + rRojo + "," + rVerde + "," + rAzul + ")",
      destacada: esDestacada,
      capa: "cercana"
    });
  }
}

//fondo procedural: cielo, nebulosa realista, estrellas titilando y viñeta.
function dibujarFondo() 
{
  background(4, 4, 12);
  actualizarBufferNebulosaSiCorresponde();
  image(bufferNebulosa, 0, 0, width, height);
  actualizarBufferEstrellasSiCorresponde();
  image(bufferEstrellas, 0, 0, width, height);
  dibujarViñeta();
}

/*buffer aparte para las estrellas, mismo criterio que el de la nebulosa: se recalculan y 
repintan sus ~915 círculos de forma intercalada con la nebulosa para no sobrecargar ningún frame. 
La deriva más rápida es de 0.07 px/frame (capa "cercana"), así que en 4 frames se mueven 
como mucho ~0.28px — imperceptible — y el brillo se sigue viendo fluido*/
let bufferEstrellas;

function crearBufferEstrellas() 
{
  bufferEstrellas = createGraphics(width, height);
}

function actualizarBufferEstrellasSiCorresponde() 
{
  /*se actualiza en frames pares no divisibles por 4 (2, 6, 10...) para intercalarse 
  exactamente con la nebulosa (0, 4, 8...) y nunca coincidir en el mismo frame*/
  if (frameCount % 4 != 2) 
  {
    return;
  }

  redibujarEstrellas();
}

function redibujarEstrellas() 
{
  bufferEstrellas.clear();

  let contexto = bufferEstrellas.drawingContext;

  for (let i = 0; i < estrellas.length; i = i + 1) 
  {
    let e = estrellas[i];
    let brillo = map(sin(frameCount * e.velocidad + e.fase), -1, 1, e.brilloMin, e.brilloMax);
    let radioActual = e.radio * map(brillo, e.brilloMin, e.brilloMax, 0.75, 1.25);

    /*deriva automática y constante por capa: las cercanas se corren más rápido que las lejanas, 
    dando la sensación de estar atravesando el espacio (parallax). El módulo con "width + 80" 
    hace que, al salir por un borde, la estrella reaparezca del otro lado sin que se note el salto*/
    let derivaCapa = 0.006;
    if (e.capa == "lejana") 
    {
      derivaCapa = 0.015;
    }
    if (e.capa == "media") 
    {
      derivaCapa = 0.035;
    }
    if (e.capa == "cercana") 
    {
      derivaCapa = 0.07;
    }

    let x = ((e.x + frameCount * derivaCapa + 40) % (width + 80)) - 40;

    contexto.fillStyle = e.colorEstilo;
    contexto.globalAlpha = brillo / 255;
    contexto.beginPath();
    contexto.arc(x, e.y, radioActual, 0, TWO_PI);
    contexto.fill();
  }

  contexto.globalAlpha = 1;
}

/*nebulosa: varios cúmulos de partículas de colores superpuestas con mezcla aditiva, como una 
nube real vista en fotografías astronómicas (no una forma geométrica lisa)*/
let nebulosas = [];

/*vetas de polvo oscuras que se dibujan encima de la nebulosa, sin mezcla aditiva, para que la 
nube no quede como una mancha de color pareja*/
let filamentos = [];

function generarNebulosas() 
{
  //cúmulo lejano: grande, difuso, cubre buena parte del cielo, colores fríos
  nebulosas.push(crearCumulo(360, 220, 560, 65, 
  [color(70, 60, 140), color(40, 110, 160), color(90, 50, 130)], 0.16, 0.0025));

  //cúmulo cercano: más chico, más denso y saturado, colores cálidos mezclados
  nebulosas.push(crearCumulo(820, 260, 340, 36, 
  [color(200, 60, 130), color(140, 70, 200), color(80, 130, 210)], 0.32, 0.004));

  //tercer cúmulo, más chico y saturado todavía, para reforzar la profundidad
  nebulosas.push(crearCumulo(980, 400, 200, 20, 
  [color(220, 90, 150), color(160, 90, 220)], 0.4, 0.006));

  /*dos cúmulos más, del lado izquierdo y arriba a la derecha, para que la nebulosa cubra 
  bastante más cielo y no se sienta concentrada en un solo sector*/
  nebulosas.push(crearCumulo(150, 520, 320, 29, 
  [color(60, 90, 160), color(90, 60, 150)], 0.2, 0.003));

  nebulosas.push(crearCumulo(1100, 140, 280, 26, 
  [color(150, 70, 190), color(70, 100, 200)], 0.24, 0.0035));

  filamentos.push(crearFilamento(430, 260, 260, 40, 0.35, 0.0008));
  filamentos.push(crearFilamento(860, 300, 180, 26, -0.5, 0.0012));
}

/*crea un cúmulo: un grupo de partículas dispersas alrededor de un centro, con más densidad 
hacia el medio (usando el promedio de tres random() para acercarse a una distribución normal)*/
function crearCumulo(cx_, cy_, radioZona_, cantidad_, colores_, alfaBase_, velocidadDrift_) 
{
  let particulas = [];

  for (let i = 0; i < cantidad_; i = i + 1) 
  {
    let angulo = random(0, TWO_PI);
    let distNormal = (random(0, 1) + random(0, 1) + random(0, 1)) / 3;
    let dist = distNormal * radioZona_;
    /*se elige el color de la paleta y se descomponen sus canales una sola vez acá (no en 
    cada frame)*/
    let colorElegido = colores_[floor(random(0, colores_.length))];
    let rRojo = floor(red(colorElegido));
    let rVerde = floor(green(colorElegido));
    let rAzul = floor(blue(colorElegido));

    particulas.push
    ({
      dx: cos(angulo) * dist,
      dy: sin(angulo) * dist * 0.55,
      radio: random(40, 110) * (1 - dist / radioZona_ * 0.4),
      colorEstilo: "rgb(" + rRojo + "," + rVerde + "," + rAzul + ")",
      fase: random(0, TWO_PI),
      velocidadPulso: random(0.003, 0.008)
    });
  }

  return { cx: cx_, cy: cy_, particulas: particulas, alfaBase: alfaBase_, 
  velocidadDrift: velocidadDrift_, fase: random(0, 1000) };
}

/*crea un filamento oscuro: partículas casi negras repartidas en una franja angosta y alargada 
(largo_ x ancho_), rotada según angulo_ (en radianes), para simular una veta de polvo real. 
velocidadDrift_ le da la misma deriva orgánica y automática que tienen los cúmulos de nebulosa*/
function crearFilamento(cx_, cy_, largo_, ancho_, angulo_, velocidadDrift_) 
{
  let particulas = [];

  for (let i = 0; i < 50; i = i + 1) 
  {
    let a1 = random(-largo_ / 2, largo_ / 2);
    let a2 = random(-ancho_ / 2, ancho_ / 2) * ((random(0, 1) + random(0, 1)) / 2);

    particulas.push({
      dx: cos(angulo_) * a1 - sin(angulo_) * a2,
      dy: sin(angulo_) * a1 + cos(angulo_) * a2,
      radio: random(30, 60),
      fase: random(0, TWO_PI),
      velocidadPulso: random(0.002, 0.005)
    });
  }

  return { cx: cx_, cy: cy_, particulas: particulas, velocidadDrift: velocidadDrift_, 
  fase: random(0, 1000) };
}

/*buffer aparte para la nebulosa (cúmulos + filamentos), del mismo tamaño que el canvas. La 
nebulosa deriva muy lento (velocidadDrift entre 0.0025 y 0.006 rad/frame). Se dibuja en este buffer 
y se vuelve a calcular de forma intercalada con las estrellas
(ver actualizarBufferNebulosaSiCorresponde); mientras tanto, dibujarFondo() reusa la 
imagen ya calculada con un solo image(), igual que ya se hacía con la viñeta*/
let bufferNebulosa;

function crearBufferNebulosa() 
{
  bufferNebulosa = createGraphics(width, height);
}

/*método: se actualiza en frames múltiplos de 4 (0, 4, 8...) para intercalarse exactamente 
con las estrellas (2, 6, 10...) y nunca coincidir en el mismo frame*/
function actualizarBufferNebulosaSiCorresponde() 
{
  if (frameCount % 4 != 0) 
  {
    return;
  }

  redibujarNebulosa();
}

function redibujarNebulosa() 
{
  bufferNebulosa.clear();

  let contexto = bufferNebulosa.drawingContext;

  //cúmulos, con mezcla aditiva (como una nube real vista en fotos astronómicas)
  contexto.save();
  contexto.globalCompositeOperation = "lighter";

  for (let n = 0; n < nebulosas.length; n = n + 1) 
  {
    let cumulo = nebulosas[n];
    //deriva lenta y automática de todo el cúmulo, en una trayectoria orgánica (no lineal)
    let derivaX = sin(frameCount * cumulo.velocidadDrift + cumulo.fase) * 70;
    let derivaY = cos(frameCount * cumulo.velocidadDrift * 0.7 + cumulo.fase) * 35;

    for (let i = 0; i < cumulo.particulas.length; i = i + 1) 
    {
      let p = cumulo.particulas[i];
      let pulso = map(sin(frameCount * p.velocidadPulso + p.fase), -1, 1, 0.6, 1.15);
      let x = cumulo.cx + p.dx + derivaX;
      let y = cumulo.cy + p.dy + derivaY;
      let alfa = cumulo.alfaBase * pulso * 8;

      dibujarManchaEnContexto(contexto, x, y, p.radio * pulso, p.colorEstilo, alfa);
    }
  }

  contexto.restore();

  /*vetas de polvo encima de la nebulosa, con mezcla normal (no aditiva) para que resten brillo 
  en vez de sumarlo: es lo que rompe la mancha de color pareja y le da textura más real*/
  contexto.save();
  contexto.fillStyle = "rgb(4, 4, 12)";

  for (let f = 0; f < filamentos.length; f = f + 1) 
  {
    let filamento = filamentos[f];
    let derivaX = sin(frameCount * filamento.velocidadDrift + filamento.fase) * 18;
    let derivaY = cos(frameCount * filamento.velocidadDrift * 0.7 + filamento.fase) * 10;

    for (let i = 0; i < filamento.particulas.length; i = i + 1) 
    {
      let p = filamento.particulas[i];
      let pulso = map(sin(frameCount * p.velocidadPulso + p.fase), -1, 1, 0.7, 1);
      let x = filamento.cx + p.dx + derivaX;
      let y = filamento.cy + p.dy + derivaY;

      let alfaFilamento = 26 * pulso;
      contexto.globalAlpha = alfaFilamento / 255;
      contexto.beginPath();
      contexto.arc(x, y, p.radio * pulso, 0, TWO_PI);
      contexto.fill();
    }
  }

  contexto.globalAlpha = 1;
  contexto.restore();
}

/*aproxima un degradé radial suave dibujando círculos concéntricos con alfa creciente, 
directo sobre el contexto nativo que se le pase (el del buffer de la nebulosa)*/
function dibujarManchaEnContexto(contexto_, x_, y_, radioMax_, colorEstilo_, alfaBase_) 
{
  let capas = 2;
  contexto_.fillStyle = colorEstilo_;

  for (let i = capas; i >= 1; i = i - 1) 
  {
    let radio = radioMax_ * (i / capas);
    let alfa = alfaBase_ * (1 - i / capas + 0.2);

    contexto_.globalAlpha = alfa / 255;
    contexto_.beginPath();
    contexto_.arc(x_, y_, radio, 0, TWO_PI);
    contexto_.fill();
  }
}

//Máquina de estados
let estado = ESTADO_MENU;

function draw() 
{
  //guardián: cada 1 segundo verifica que el motor de audio siga activo si la ventana está visible
  if (frameCount % 60 == 0 && document.visibilityState == "visible") 
  {
    if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
    {
      getAudioContext().resume();
    }
  }

  //efecto de interferencia en la música cuando el astronauta está atrapado (rover)
  if (interferenciaActiva == true && musica.isPlaying() == true) 
  {
    //entrecortado drástico simulando pérdida de señal sin usar pause/play
    if (frameCount - frameUltimoCorteInterferencia > random(3, 8)) 
    {
      //corte completo momentáneo (volumen 0)
      musica.amp(0.0, 0.01);
      frameUltimoCorteInterferencia = frameCount;
    }
    else if (frameCount - frameUltimoCorteInterferencia == 1) 
    {
      //reanudación con volumen muy bajo
      musica.amp(random(0.05, 0.15), 0.01);
    }
    else if (frameCount - frameUltimoCorteInterferencia == 2) 
    {
      //volumen medio-bajo
      musica.amp(random(0.1, 0.2), 0.01);
    }
    else 
    {
      //recuperación parcial con variación
      musica.amp(random(0.15, 0.3), 0.01);
    }
  } 
  else if (interferenciaActiva == false && musica.isPlaying() == true) 
  {
    //restaurar volumen normal cuando no hay interferencia
    musica.amp(0.3, 0.2);
  }

  switch(estado) 
  {
    case ESTADO_MENU:
      dibujarFondo();

      push();
      fill(255);
      textFont(fuenteBoton);
      textAlign(CENTER, CENTER);
      textSize(36);
      text("UMBRAL", 640, 190);
      pop();

      /*toggles a los costados del título: música a la izquierda, pantalla completa a la derecha.
      Quedan alineados con el ancho del botón JUGAR (320 de ancho, centrado en 640): el borde 
      izquierdo del de música coincide con el izquierdo de JUGAR (480) y el borde derecho del 
      de pantalla completa coincide con el derecho de JUGAR (800)*/
      dibujarToggle(musica.isPlaying() ? musicaApagarIcono : musicaEncenderIcono, 500, 196, 40);
      dibujarToggle(document.fullscreenElement ? pantallaIncompletaIcono : pantallaCompletaIcono, 
      780, 196, 40);

      dibujarBoton("JUGAR", 640, 261, 320, 48, color(224, 205, 170), color(0));

      dibujarBoton("PUNTAJES", 640, 327, 320, 48);
      dibujarBoton("INSTRUCCIONES", 640, 393, 320, 48);
      dibujarBoton("CRÉDITOS", 640, 459, 320, 48);
    break;

    case ESTADO_INSTRUCCIONES:
      dibujarFondo();
      dibujarBoton("JUGAR", 640, 510, 320, 48, color(224, 205, 170), color(0));
      dibujarBoton("ATRÁS", 640, 576, 320, 48, 0);
      dibujarCuadroInstrucciones();
    break;

    case ESTADO_CREDITOS:
      dibujarFondo();
      dibujarBoton("ATRÁS", 640, 450, 320, 48, 0);
      dibujarCuadro("Autoría: Daniel Toledo\nEste minijuego representa la capacidad tecnológica humana actual para explorar el universo, y también sus límites físicos al enfrentarlo.",
      640, 320, 1000, 150);
    break;

    case ESTADO_PUNTAJES:
      dibujarFondo();
      dibujarBoton("ATRÁS", 640, 520, 320, 48, 0);

      //arma el texto con los 3 mejores puntajes guardados en este navegador ("—" si falta alguno)
      let listaPuntajes = obtenerPuntajes();
      let textoPuntajes = "MEJORES PUNTAJES\n\n";

      for (let i = 0; i < 3; i = i + 1) 
      {
        let datoPuntaje = listaPuntajes[i];
        textoPuntajes = textoPuntajes + (i + 1) + ". ";

        if (datoPuntaje == undefined) 
        {
          textoPuntajes = textoPuntajes + "—";
        } 
        else if (datoPuntaje.resultado == "") 
        {
          //puntaje viejo, normalizado en obtenerPuntajes() pero sin resultado/O2/W/plataforma
          textoPuntajes = textoPuntajes + datoPuntaje.segundos + " segundos";
        } 
        else 
        {
          /*no se muestran los segundos: esta pantalla solo lista el top 3, que en la práctica son 
          victorias*/
          textoPuntajes = textoPuntajes + "O2/W " + datoPuntaje.nivelO2W + " · Plataforma " + 
          datoPuntaje.porcentajePlataforma + "% · Desviados " + datoPuntaje.cantidadDesviados;
        }

        if (i < 2) 
        {
          textoPuntajes = textoPuntajes + "\n";
        }
      }

      dibujarCuadro(textoPuntajes, 640, 300, 980, 240);
    break;

    case ESTADO_JUEGO:
      dibujarFondo();

      //el tiempo mostrado se congela apenas hay resultado (frameDeFin queda fijo)
      let framesTranscurridos;
      if (juego.resultado == "") 
      {
        framesTranscurridos = frameCount - juego.frameDeInicio;
      } 
      else 
      {
        framesTranscurridos = juego.frameDeFin - juego.frameDeInicio;
      }

      let segundosRestantes = 60 - floor(framesTranscurridos / 60);
      if (segundosRestantes < 0) 
      {
        segundosRestantes = 0;
      }

      if (juego.resultado == "") 
      {
        juego.astronauta.actualizar(juego);
        juego.actualizarMeteoritos(framesTranscurridos);
        juego.actualizarDisparo();
        juego.satelite.dibujar(framesTranscurridos);
        juego.sonda.dibujar(framesTranscurridos);

        /*las condiciones de derrota van primero: si O2/W o plataforma fallan en el mismo frame 
        en que se acaba el tiempo, cuenta como derrota (hace falta O2/W mayor a cero para ganar)*/
        if (juego.nivelO2W <= 0) 
        {
          juego.resultado = "DERROTA";
          juego.detalleResultado = "Te quedaste sin O2/W.";
          juego.frameDeFin = frameCount;
          interferenciaActiva = false;
        }
        else if (juego.cantidadBloqueadas >= juego.totalCeldasActivas * juego.porcentajeColapso) 
        {
          juego.resultado = "DERROTA";
          juego.detalleResultado = "La plataforma colapsó.";
          juego.frameDeFin = frameCount;
          interferenciaActiva = false;
        }
        else if (segundosRestantes <= 0) 
        {
          juego.resultado = "VICTORIA";
          juego.frameDeFin = frameCount;
          interferenciaActiva = false;
        }

        /*recién se fijó el resultado en este mismo frame: se guarda el puntaje una única vez 
        (solo victorias)*/
        if (juego.resultado == "VICTORIA") 
        {
          let segundosSobrevividos = floor(framesTranscurridos / 60);
          if (segundosSobrevividos > 60) 
          {
            segundosSobrevividos = 60;
          }

          let porcentajeIntactaFinal = 100 - floor((juego.cantidadBloqueadas / 
          juego.totalCeldasActivas) * 100);

          guardarPuntaje(segundosSobrevividos, juego.resultado, juego.nivelO2W, porcentajeIntactaFinal, 
          juego.cantidadDesviados);
        }
      }

      juego.dibujarPlataforma();
      juego.astronauta.dibujar();
      juego.dibujarMeteoritos();


      /*HUD: tiempo como cronómetro, O2/W como batería (verde = vida, rojo = daño) e integridad 
      de la plataforma como círculo (gris claro = celdas intactas, gris oscuro = bloqueadas)*/
      push();

      //tiempo restante en formato M:SS
      let segundosSoloRestantes = segundosRestantes % 60;
      let textoSegundos = segundosSoloRestantes < 10 ? "0" + segundosSoloRestantes : "" + 
      segundosSoloRestantes;
      let textoTiempo = floor(segundosRestantes / 60) + ":" + textoSegundos;

      noStroke();
      fill(255);
      textFont(fuenteCuadro);
      textAlign(RIGHT, TOP);
      textSize(24);
      text(textoTiempo, 1225, 50);

      /*batería de O2/W: fondo rojo (daño) con relleno verde proporcional a lo que queda. bateriaX 
      centrada con el círculo de plataforma (circuloX) y bateriaY afinada para quedar equidistante 
      entre el cronómetro (arriba) y el círculo de plataforma (abajo)*/
      let bateriaX = 1165;
      let bateriaY = 92;
      let bateriaAncho = 72;
      let bateriaAlto = 24;
      let fraccionO2W = juego.nivelO2W / 90;
      if (fraccionO2W < 0) 
      {
        fraccionO2W = 0;
      }

      noStroke();
      fill(200, 40, 40);
      rect(bateriaX, bateriaY, bateriaAncho, bateriaAlto);
      fill(60, 200, 90);
      rect(bateriaX, bateriaY, bateriaAncho * fraccionO2W, bateriaAlto);
      noFill();
      stroke(255);
      strokeWeight(2);
      rect(bateriaX, bateriaY, bateriaAncho, bateriaAlto, 4);
      noStroke();
      fill(255);
      rect(bateriaX + bateriaAncho, bateriaY + bateriaAlto / 2 - 5, 5, 10);

      //círculo de integridad de la plataforma: gris oscuro de fondo, gris claro por lo intacto
      let circuloX = 1201;
      let circuloY = 158;
      let circuloRadio = 22;
      let fraccionIntacta = 1 - (juego.cantidadBloqueadas / juego.totalCeldasActivas);
      if (fraccionIntacta < 0) 
      {
        fraccionIntacta = 0;
      }

      noStroke();
      fill(70);
      ellipse(circuloX, circuloY, circuloRadio * 2, circuloRadio * 2);
      fill(210);
      if (fraccionIntacta > 0) 
      {
        arc(circuloX, circuloY, circuloRadio * 2, circuloRadio * 2, -HALF_PI, -HALF_PI + 
        fraccionIntacta * TWO_PI, PIE);
      }

      pop();

      //efecto visual del disparo
      if (frameCount - frameDisparo < 8) 
      {
        push();
        noFill();
        stroke(255, 120, 60, map(frameCount - frameDisparo, 0, 8, 255, 0));
        strokeWeight(2);
        circle(disparoX, disparoY, (frameCount - frameDisparo) * 6);
        pop();
      }

      if (juego.resultado != "") 
      {
        let segundosJugados = floor(framesTranscurridos / 60);
        if (segundosJugados > 60) 
        {
          segundosJugados = 60;
        }

        dibujarCuadro(juego.resultado + "\n" + juego.detalleResultado + "\nSobreviviste " + 
        segundosJugados + " segundos.", 640, 327, 500, 230);
        dibujarBoton("JUGAR DE NUEVO", 640, 469, 320, 48, 0);
        dibujarBoton("INICIO", 640, 535, 320, 48, 0);
      }
    break;
  }

  dibujaPuntero();
}

//se llama una única vez por click (sirve para los botones del menú)
function mousePressed()
{
  if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
  {
    getAudioContext().resume();
  }

  switch(estado) 
  {
    case ESTADO_MENU:
      if(mouseOverRect(500, 196, 40, 40))
      {
        /*se reanuda el AudioContext y se arranca/pausa la música en el mismo paso síncrono del 
        click: si loop() se llama recién adentro del .then() de userStartAudio(), ese llamado 
        queda afuera del gesto original y en algunos navegadores el sonido no arranca hasta 
        recargar la página*/
        if (getAudioContext().state != "running") 
        {
          getAudioContext().resume();
        }

        if (musica.isPlaying())
        {
          musica.pause();
        }
        else
        {
          musica.setLoop(true);
          musica.loop();
          //asegurar volumen normal al reanudar
          musica.amp(0.3, 0.1);
        }
      }

      if(mouseOverRect(780, 196, 40, 40))
      {
        alternarPantallaCompleta();
      }

      if(mouseOverRect(640, 261, 320, 48))
      {
        //frameCount para la partida arranca acá, no antes
        juego.frameDeInicio = frameCount;
        juego.reiniciar();
        estado = ESTADO_JUEGO;
      }

      chequearClick(640, 327, 320, 48, ESTADO_PUNTAJES);
      chequearClick(640, 393, 320, 48, ESTADO_INSTRUCCIONES);
      chequearClick(640, 459, 320, 48, ESTADO_CREDITOS);
    break;

    case ESTADO_INSTRUCCIONES:
      if(mouseOverRect(640, 510, 320, 48))
      {
        //mismo reinicio que el botón JUGAR del menú
        juego.frameDeInicio = frameCount;
        juego.reiniciar();
        estado = ESTADO_JUEGO;
      }
      chequearClick(640, 576, 320, 48, ESTADO_MENU);
    break;

    case ESTADO_CREDITOS:
      chequearClick(640, 450, 320, 48, ESTADO_MENU);
    break;

    case ESTADO_PUNTAJES:
      chequearClick(640, 520, 320, 48, ESTADO_MENU);
    break;

    case ESTADO_JUEGO:
      if (juego.resultado != "") 
      {
        if(mouseOverRect(640, 469, 320, 48))
        {
          //mismo reinicio que el botón JUGAR del menú
          juego.frameDeInicio = frameCount;
          juego.reiniciar();
          estado = ESTADO_JUEGO;
        }
        if(mouseOverRect(640, 535, 320, 48))
        {
          interferenciaActiva = false;
          if (musica.isPlaying() == true) 
          {
            musica.amp(0.3, 0.1);
          }
          estado = ESTADO_MENU;
        }
      }
    break;
  }
}

//Programación Orientada a Objetos con Inteligencia Artificial

//Clases

class Juego 
{
  constructor() 
  {
    //propiedades de la plataforma
    this.tamañoBloque = 45;
    this.cantidadColumnas = 26;
    this.cantidadFilasPlataforma = 8;
    this.cantidadActivaInicial = 26;
    this.decrementoPorFila = 2;
    this.centroXPlataforma = 640;
    this.centroYPlataforma = 720;
    this.filas = [];
    this.generarFilas();

    /*arrays reutilizables para obtenerCeldaActivaAlAzar() y obtenerCeldaGrisClaroAlAzar(): 
    se vacían con .length = 0 y se llenan de nuevo sobre el mismo array. Se usan pares 
    distintos para cada método porque obtenerCeldaGrisClaroAlAzar() puede llamarse en medio 
    de un uso de obtenerCeldaActivaAlAzar() (agotarVerde) y no deben pisarse entre sí*/
    this._cacheFilasActivas = [];
    this._cacheColumnasActivas = [];
    this._cacheFilasGrisClaro = [];
    this._cacheColumnasGrisClaro = [];

    //frame en el que arranca la partida (se actualiza al presionar JUGAR)
    this.frameDeInicio = 0;
    //frame en el que termina la partida (se fija una única vez al haber resultado)
    this.frameDeFin = 0;

    //nivel de O2/W, por posición del astronauta (no por tiempo puro)
    this.nivelO2W = 90;
    this.cantidadDescuentoNivelGris = 3;
    this.cantidadDescuentoNivelRojo = 9;
    //cuánto tiempo queda atrapado el Rover en un bloque rojo antes de liberarse solo
    this.duracionAtrapadoFrames = 360;

    /*un bloque verde (Tierra) no estabiliza para siempre: si el usuario permanece quieto 
    demasiado tiempo, se agota y pasa a gris claro (Luna), como cualquier otro. Así no 
    alcanza con plantarse en un solo bloque verde*/
    this.duracionVerdeFrames = 240;

    //resultado de la partida ("" mientras se juega, "VICTORIA" o "DERROTA" al terminar)
    this.resultado = "";
    this.detalleResultado = "";

    /*integridad de la plataforma: si se bloquea demasiado (no solo la celda propia), se 
    pierde la partida aunque el O2/W esté bien. Así no alcanza con defender un solo bloque*/
    this.totalCeldasActivas = this.contarCeldasActivas();
    this.cantidadBloqueadas = 0;
    this.porcentajeColapso = 0.3;

    /*meteoritos: pool fijo de objetos reciclados (ver generarPoolMeteoritos), en vez de crear 
    uno nuevo por cada aparición. Evita el picoteo de rendimiento por recolección de basura 
    cuando se crean/descartan muchos objetos seguidos*/
    this.generarPoolMeteoritos();
    //el ritmo de aparición arranca más tranquilo y se acelera hacia el final de la partida
    this.intervaloMeteoritoInicial = 46;
    this.intervaloMeteoritoFinal = 24;
    this.frameUltimoMeteorito = 0;

    /*disparo contra meteoritos (click izquierdo sostenido, con enfriamiento entre disparo y 
    disparo)*/
    this.proximoFrameDisparo = 0;
    this.cooldownDisparo = 15;
    this.radioDisparo = 26;
    //cuántos meteoritos desvió el jugador de un disparo en esta partida
    this.cantidadDesviados = 0;

    //astronauta: se mueve por filas y columnas, cambia a Rover si queda atrapado en rojo
    this.astronauta = new Astronauta(floor(this.cantidadColumnas / 2), this);

    //extras: solo ambientación de fondo, no interactúan con la partida
    this.satelite = new Satelite();
    this.sonda = new Sonda();
  }

  //método: genera (o regenera) el array 2D de la plataforma, fila por fila
  generarFilas() 
  {
    this.filas = [];

    for (let i = 1; i <= this.cantidadFilasPlataforma; i = i + 1) 
    {
      let cantidadActivaEnEstaFila = this.cantidadActivaInicial - (i - 1) * this.decrementoPorFila;

      if (cantidadActivaEnEstaFila < 1) 
      {
        cantidadActivaEnEstaFila = 1;
      }

      this.filas.push(new Fila(i, cantidadActivaEnEstaFila, this.cantidadColumnas, this.tamañoBloque, 
      this.centroXPlataforma, this.centroYPlataforma));
    }

    this.garantizarVerde();
  }

  //método: si ningún bloque salió verde al azar, fuerza uno para que siempre haya al menos uno
  garantizarVerde() 
  {
    let hayVerde = false;

    for (let i = 0; i < this.filas.length; i = i + 1) 
    {
      for (let j = 0; j < this.cantidadColumnas; j = j + 1) 
      {
        if (this.filas[i].bloques[j] == TIPO_VERDE) 
        {
          hayVerde = true;
        }
      }
    }

    if (hayVerde == false) 
    {
      let filaElegida = floor(random(this.filas.length));
      let columnaElegida = floor(random(this.cantidadColumnas));

      if (this.filas[filaElegida].bloques[columnaElegida] != TIPO_VACIO) 
      {
        this.filas[filaElegida].bloques[columnaElegida] = TIPO_VERDE;
      }
    }
  }

  //método: reinicia el estado de una partida nueva (sin recrear todo el objeto Juego)
  reiniciar() 
  {
    if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
    {
      getAudioContext().resume();
    }

    frameUltimoSonidoMeteorito = -10;
    interferenciaActiva = false;
    frameUltimoCorteInterferencia = 0;

    if (musica.isPlaying() == true) 
    {
      musica.amp(0.3, 0.1);
    }

    this.generarFilas();
    this.nivelO2W = 90;
    this.resultado = "";
    this.detalleResultado = "";
    this.frameDeFin = 0;
    this.totalCeldasActivas = this.contarCeldasActivas();
    this.cantidadBloqueadas = 0;
    this.generarPoolMeteoritos();
    this.frameUltimoMeteorito = 0;
    this.proximoFrameDisparo = 0;
    this.cantidadDesviados = 0;
    this.astronauta = new Astronauta(floor(this.cantidadColumnas / 2), this);
  }

  /*método: crea de una vez un lote fijo de meteoritos "apagados" (activo: false), muy por 
  encima del pico real de meteoritos simultáneos (~8-10), para tener margen de sobra. Se 
  reutilizan durante toda la partida en vez de crear/descartar objetos nuevos todo el tiempo*/
  generarPoolMeteoritos() 
  {
    this.meteoritos = [];

    for (let i = 0; i < 45; i = i + 1) 
    {
      this.meteoritos.push(new Meteorito());
    }
  }

  /*método: dibuja todas las filas de la plataforma. stroke/strokeWeight/rectMode se fijan acá 
  una sola vez para toda la plataforma*/
  dibujarPlataforma() 
  {
    push();
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);

    for (let i = 0; i < this.filas.length; i = i + 1) 
    {
      this.filas[i].dibujar();
    }

    pop();
  }

  //método: devuelve el número de fila (superficie) más alto activo para una columna dada
  obtenerFilaSuperficie(columna_) 
  {
    for (let i = this.filas.length - 1; i >= 0; i = i - 1) 
    {
      if (this.filas[i].bloques[columna_] != TIPO_VACIO) 
      {
        return this.filas[i].numeroDeFila;
      }
    }

    return 0;
  }

  /*método: devuelve el tipo de bloque de una celda puntual (fila y columna exactas), 
  para el movimiento vertical*/
  obtenerTipoDeCelda(fila_, columna_) 
  {
    if (fila_ < 1 || fila_ > this.filas.length) 
    {
      return TIPO_VACIO;
    }

    return this.filas[fila_ - 1].bloques[columna_];
  }

  //método: devuelve la columna donde empieza el rango activo de una fila puntual
  obtenerColumnaInicioFila(fila_) 
  {
    return this.filas[fila_ - 1].columnaInicio;
  }

  //método: devuelve la columna donde termina (exclusivo) el rango activo de una fila puntual
  obtenerColumnaFinFila(fila_) 
  {
    return this.filas[fila_ - 1].columnaFin;
  }

  /*método: para el toroide horizontal. Busca, desde un extremo de la fila hacia el otro,
  la primera columna activa que NO esté bloqueada. Así, si el extremo exacto quedó
  bloqueado por un meteorito, el toroide sigue funcionando con la celda libre más cercana
  a ese extremo (en vez de romperse para siempre). Devuelve -1 si toda la fila está bloqueada*/
  buscarColumnaLibreDesdeExtremo(fila_, columnaInicio_, columnaFin_, desdeLaDerecha_) 
  {
    if (desdeLaDerecha_ == true) 
    {
      for (let columna = columnaFin_ - 1; columna >= columnaInicio_; columna = columna - 1) 
      {
        if (this.obtenerTipoDeCelda(fila_, columna) != TIPO_GRIS_OSCURO) 
        {
          return columna;
        }
      }
    } 
    else 
    {
      for (let columna = columnaInicio_; columna < columnaFin_; columna = columna + 1) 
      {
        if (this.obtenerTipoDeCelda(fila_, columna) != TIPO_GRIS_OSCURO) 
        {
          return columna;
        }
      }
    }

    return -1;
  }

  /*método: para el toroide vertical. Misma idea que buscarColumnaLibreDesdeExtremo, pero
  recorriendo las filas de una columna puntual. Devuelve -1 si toda la columna está bloqueada*/
  buscarFilaLibreDesdeExtremo(columna_, filaTecho_, desdeArriba_) 
  {
    if (desdeArriba_ == true) 
    {
      for (let fila = filaTecho_; fila >= 1; fila = fila - 1) 
      {
        if (this.obtenerTipoDeCelda(fila, columna_) != TIPO_GRIS_OSCURO) 
        {
          return fila;
        }
      }
    } 
    else 
    {
      for (let fila = 1; fila <= filaTecho_; fila = fila + 1) 
      {
        if (this.obtenerTipoDeCelda(fila, columna_) != TIPO_GRIS_OSCURO) 
        {
          return fila;
        }
      }
    }

    return -1;
  }

  /*método: junta todas las celdas activas (no vacías) de toda la plataforma y elige una al 
  azar, para que el meteorito pueda caer en cualquier bloque (no solo en la superficie).
  se usan dos arrays paralelos (fila y columna) en vez de un array de objetos, y se
  devuelve un array de 2 elementos: [fila, columna]*/
  obtenerCeldaActivaAlAzar() 
  {
    let filasActivas = this._cacheFilasActivas;
    let columnasActivas = this._cacheColumnasActivas;
    filasActivas.length = 0;
    columnasActivas.length = 0;

    for (let i = 0; i < this.filas.length; i = i + 1) 
    {
      for (let columna = 0; columna < this.cantidadColumnas; columna = columna + 1) 
      {
        if (this.filas[i].bloques[columna] != TIPO_VACIO) 
        {
          filasActivas.push(this.filas[i].numeroDeFila);
          columnasActivas.push(columna);
        }
      }
    }

    let indiceElegido = floor(random(filasActivas.length));

    return [filasActivas[indiceElegido], columnasActivas[indiceElegido]];
  }

  /*método: marca como bloqueado un bloque puntual (fila y columna), tras el impacto de un 
  meteorito*/
  marcarBloqueado(fila_, columna_) 
  {
    //sólo suma al contador de colapso la primera vez que ESE bloque se bloquea
    if (this.filas[fila_ - 1].bloques[columna_] != TIPO_GRIS_OSCURO) 
    {
      this.cantidadBloqueadas = this.cantidadBloqueadas + 1;
    }

    this.filas[fila_ - 1].bloques[columna_] = TIPO_GRIS_OSCURO;
  }

  /*método: agota un bloque verde puntual (pasa a gris claro, como la Luna) y lo reubica en 
  otro gris claro al azar*/
  agotarVerde(fila_, columna_) 
  {
    this.filas[fila_ - 1].bloques[columna_] = TIPO_GRIS_CLARO;

    let celdaNueva = this.obtenerCeldaGrisClaroAlAzar(fila_, columna_);

    if (celdaNueva[0] != -1) 
    {
      this.filas[celdaNueva[0] - 1].bloques[celdaNueva[1]] = TIPO_VERDE;
    }
  }

  /*método: elige al azar una celda de tipo gris claro entre toda la plataforma (para 
  reubicar un verde agotado), excluyendo la celda que se acaba de agotar. Devuelve 
  [-1, -1] si no queda ninguna disponible*/
  obtenerCeldaGrisClaroAlAzar(filaExcluida_, columnaExcluida_) 
  {
    let filasCandidatas = this._cacheFilasGrisClaro;
    let columnasCandidatas = this._cacheColumnasGrisClaro;
    filasCandidatas.length = 0;
    columnasCandidatas.length = 0;

    for (let i = 0; i < this.filas.length; i = i + 1) 
    {
      for (let columna = 0; columna < this.cantidadColumnas; columna = columna + 1) 
      {
        let esLaMismaCelda = (this.filas[i].numeroDeFila == filaExcluida_ && 
        columna == columnaExcluida_);

        if (this.filas[i].bloques[columna] == TIPO_GRIS_CLARO && esLaMismaCelda == false) 
        {
          filasCandidatas.push(this.filas[i].numeroDeFila);
          columnasCandidatas.push(columna);
        }
      }
    }

    if (filasCandidatas.length == 0) 
    {
      return [-1, -1];
    }

    let indiceElegido = floor(random(filasCandidatas.length));

    return [filasCandidatas[indiceElegido], columnasCandidatas[indiceElegido]];
  }

  /*método: cuenta cuantas celdas activas (no vacías) tiene toda la plataforma, para el 
  porcentaje de colapso*/
  contarCeldasActivas() 
  {
    let total = 0;

    for (let i = 0; i < this.filas.length; i = i + 1) 
    {
      for (let columna = 0; columna < this.cantidadColumnas; columna = columna + 1) 
      {
        if (this.filas[i].bloques[columna] != TIPO_VACIO) 
        {
          total = total + 1;
        }
      }
    }

    return total;
  }

  /*método: genera meteoritos nuevos y actualiza los existentes. El intervalo entre 
  apariciones se interpola desde intervaloMeteoritoInicial hasta intervaloMeteoritoFinal 
  a lo largo de los 60 segundos, así la partida se pone más difícil hacia el final*/
  actualizarMeteoritos(framesTranscurridos_) 
  {
    let progresoPartida = constrain(framesTranscurridos_ / (60 * 60), 0, 1);
    let intervaloActual = lerp(this.intervaloMeteoritoInicial, this.intervaloMeteoritoFinal, 
    progresoPartida);

    if (framesTranscurridos_ - this.frameUltimoMeteorito >= intervaloActual) 
    {
      let meteoritoReciclado = this.buscarMeteoritoLibre();

      if (meteoritoReciclado != null) 
      {
        meteoritoReciclado.generar(this);
      }

      this.frameUltimoMeteorito = framesTranscurridos_;
    }

    for (let i = 0; i < this.meteoritos.length; i = i + 1) 
    {
      this.meteoritos[i].actualizar(this);
    }
  }

  /*método: busca en el pool un meteorito que no esté activo ni explotando (disponible para 
  reciclar). Si el pool estuviera lleno de meteoritos ocupados, devuelve null y esa aparición 
  puntual se salta (con 45 de margen sobre un pico real de ~8-10, no debería pasar nunca)*/
  buscarMeteoritoLibre() 
  {
    for (let i = 0; i < this.meteoritos.length; i = i + 1) 
    {
      if (this.meteoritos[i].activo == false && this.meteoritos[i].explotando == false) 
      {
        return this.meteoritos[i];
      }
    }

    return null;
  }

  /*método: dibuja todos los meteoritos (activos o en animación de explosión). Los que están 
  apagados y sin explotar se quedan en el array sin hacer nada, esperando ser reciclados por 
  buscarMeteoritoLibre() — ya no se podan ni se vuelven a crear*/
  dibujarMeteoritos() 
  {
    for (let i = 0; i < this.meteoritos.length; i = i + 1) 
    {
      this.meteoritos[i].dibujar();
    }
  }

  //método: mientras se mantenga presionado el click izquierdo, dispara contra el meteorito en ráfaga
  actualizarDisparo() 
  {
    if (mouseIsPressed == false) 
    {
      return;
    }

    if (frameCount < this.proximoFrameDisparo) 
    {
      return;
    }

    for (let i = 0; i < this.meteoritos.length; i = i + 1) 
    {
      let m = this.meteoritos[i];

      if (m.activo == true && dist(m.x, m.y, mouseX, mouseY) < this.radioDisparo) 
      {
        m.interceptar();
        this.cantidadDesviados = this.cantidadDesviados + 1;
        disparoX = m.x;
        disparoY = m.y;
        frameDisparo = frameCount;
        this.proximoFrameDisparo = frameCount + this.cooldownDisparo;
        break;
      }
    }
  }
}

class Fila 
{
  constructor(numeroDeFila_, cantidadActiva_, cantidadColumnas_, tamañoBloque_, centroX_, centroY_) 
  {
    //propiedades
    this.numeroDeFila = numeroDeFila_;
    this.cantidadActiva = cantidadActiva_;
    this.cantidadColumnas = cantidadColumnas_;
    this.tamañoBloque = tamañoBloque_;
    this.centroX = centroX_;
    this.centroY = centroY_;
    this.bloques = [];

    /*bucle de construcción: recorre las columnas y arma esta fila, con tipo aleatorio en 
    cada fila activa se guardan columnaInicio/columnaFin como propiedades: son el rango activo 
    real de ESTA fila, usado después para el toroide horizontal (cada fila de la pirámide 
    tiene su propio ancho)*/
    this.columnaInicio = floor((this.cantidadColumnas - this.cantidadActiva) / 2);
    this.columnaFin = this.columnaInicio + this.cantidadActiva;

    for (let columna = 0; columna < this.cantidadColumnas; columna = columna + 1) 
    {
      if (columna >= this.columnaInicio && columna < this.columnaFin) 
      {
        this.bloques[columna] = this.tipoAleatorio();
      } 
      else 
      {
        this.bloques[columna] = TIPO_VACIO;
      }
    }
  }

  //método: sortea el tipo de un bloque activo (gris claro, rojo o verde)
  tipoAleatorio() 
  {
    let numeroAleatorio = random();

    if (numeroAleatorio < 0.7) 
    {
      return TIPO_GRIS_CLARO;
    } 
    else if (numeroAleatorio < 0.9) 
    {
      return TIPO_ROJO;
    } 
    else 
    {
      return TIPO_VERDE;
    }
  }

  //método: dibuja esta fila
  dibujar() 
  {
    /*bucle de recorrido: recorre las columnas ya construidas y dibuja cada bloque activo. 
    stroke/strokeWeight/rectMode ya vienen fijados una sola vez desde dibujarPlataforma(), 
    así que acá solo se cambia el fill (que sí varía por bloque) y se dibuja el rect*/
    for (let columna = 0; columna < this.cantidadColumnas; columna = columna + 1) 
    {
      if (this.bloques[columna] != TIPO_VACIO) 
      {
        let posX = this.centroX - (this.cantidadColumnas * this.tamañoBloque) / 2 + 
        (columna + 0.5) * this.tamañoBloque;
        let posY = this.centroY - this.tamañoBloque / 2 - (this.numeroDeFila - 1) * this.tamañoBloque;

        fill(colorDeTipo(this.bloques[columna]));
        rect(posX, posY, this.tamañoBloque, this.tamañoBloque);
      }
    }
  }
}
 
//se mueve por filas y columnas (grilla), cambia a Rover si queda atrapado en rojo
class Astronauta 
{
  constructor(columnaInicial_, juego_) 
  {
    this.columna = columnaInicial_;
    this.fila = juego_.obtenerFilaSuperficie(columnaInicial_);
    this.columnaAnterior = this.columna;
    this.filaAnterior = this.fila;
    this.x = 0;
    this.y = 0;
    this.atrapado = false;
    this.framesQuieto = 0;
    this.proximoFrameMovimiento = 0;
    this.velocidadMovimiento = 8;
  }

  //método: actualiza movimiento, posición en pantalla y nivel de O2/W
  actualizar(juego_) 
  {
    this.moverse(juego_);
    this.posicionarse(juego_);
    this.actualizarNivel(juego_);
  }

  //método: procesa el input de flechas, en las 4 direcciones (bloqueado si está atrapado)
  moverse(juego_) 
  {
    if (this.atrapado == true) 
    {
      return;
    }

    if (frameCount < this.proximoFrameMovimiento) 
    {
      return;
    }

    let columnaDeseada = this.columna;
    let filaDeseada = this.fila;

    if (teclaArribaPresionada == true) 
    {
      filaDeseada = this.fila + 1;
    }
    if (teclaAbajoPresionada == true) 
    {
      filaDeseada = this.fila - 1;
    }
    if (teclaIzquierdaPresionada == true) 
    {
      columnaDeseada = this.columna - 1;
    }
    if (teclaDerechaPresionada == true) 
    {
      columnaDeseada = this.columna + 1;
    }

    if (columnaDeseada == this.columna && filaDeseada == this.fila) 
    {
      return;
    }

    /*toroide vertical: el techo de cada columna es distinto (la pirámide es más angosta 
    arriba). Si el extremo está bloqueado por un meteorito, se busca la primera celda 
    libre desde ese extremo (así un bloqueo puntual no rompe el toroide para siempre)*/
    let filaTechoColumna = juego_.obtenerFilaSuperficie(this.columna);

    if (filaDeseada < 1) 
    {
      filaDeseada = juego_.buscarFilaLibreDesdeExtremo(this.columna, filaTechoColumna, true);
    }
    if (filaDeseada > filaTechoColumna) 
    {
      filaDeseada = juego_.buscarFilaLibreDesdeExtremo(this.columna, filaTechoColumna, false);
    }

    //toda la columna está bloqueada: no hay donde reaparecer, no se mueve
    if (filaDeseada == -1) 
    {
      return;
    }

    /*toroide horizontal: cada fila tiene su propio ancho activo (la pirámide es más angosta 
    arriba). Misma idea que el vertical: si el extremo está bloqueado, se busca la primera 
    celda libre desde ese extremo*/
    let columnaInicioFila = juego_.obtenerColumnaInicioFila(filaDeseada);
    let columnaFinFila = juego_.obtenerColumnaFinFila(filaDeseada);

    if (columnaDeseada < columnaInicioFila) 
    {
      columnaDeseada = juego_.buscarColumnaLibreDesdeExtremo(filaDeseada, columnaInicioFila, 
      columnaFinFila, true);
    }
    if (columnaDeseada >= columnaFinFila) 
    {
      columnaDeseada = juego_.buscarColumnaLibreDesdeExtremo(filaDeseada, columnaInicioFila, 
      columnaFinFila, false);
    }

    //toda la fila está bloqueada: no hay donde reaparecer, no se mueve
    if (columnaDeseada == -1) 
    {
      return;
    }

    let tipoDestino = juego_.obtenerTipoDeCelda(filaDeseada, columnaDeseada);

    //no se puede pisar un bloque bloqueado
    if (tipoDestino != TIPO_GRIS_OSCURO && tipoDestino != TIPO_VACIO) 
    {
      this.columna = columnaDeseada;
      this.fila = filaDeseada;
      this.proximoFrameMovimiento = frameCount + this.velocidadMovimiento;
    }
  }

  //método: calcula su posición en pantalla según su fila y columna actuales
  posicionarse(juego_) 
  {
    this.x = juego_.centroXPlataforma - (juego_.cantidadColumnas * juego_.tamañoBloque) / 2 + 
    (this.columna + 0.5) * juego_.tamañoBloque;

    this.y = juego_.centroYPlataforma - this.fila * juego_.tamañoBloque;
  }

  //método: aplica el descuento de O2/W según el bloque pisado y cuánto tiempo lleva ahí
  actualizarNivel(juego_) 
  {
    let tipoActual = juego_.obtenerTipoDeCelda(this.fila, this.columna);

    if (this.columna != this.columnaAnterior || this.fila != this.filaAnterior) 
    {
      //nueva pisada
      if (tipoActual == TIPO_GRIS_CLARO) 
      {
        juego_.nivelO2W = juego_.nivelO2W - juego_.cantidadDescuentoNivelGris;
      }
      if (tipoActual == TIPO_ROJO) 
      {
        this.atrapado = true;
        interferenciaActiva = true;
      }

      this.framesQuieto = 0;
      this.columnaAnterior = this.columna;
      this.filaAnterior = this.fila;
    } 
    else 
    {
      //se mantiene en la misma posición: se acumula el descuento cada segundo
      this.framesQuieto = this.framesQuieto + 1;

      //un bloque verde pisado demasiado tiempo se agota (pasa a gris claro) y deja de estabilizar
      if (tipoActual == TIPO_VERDE && this.framesQuieto == juego_.duracionVerdeFrames) 
      {
        juego_.agotarVerde(this.fila, this.columna);
      }

      if (this.framesQuieto % 60 == 0) 
      {
        if (tipoActual == TIPO_GRIS_CLARO) 
        {
          juego_.nivelO2W = juego_.nivelO2W - juego_.cantidadDescuentoNivelGris;
        }
        if (tipoActual == TIPO_ROJO) 
        {
          juego_.nivelO2W = juego_.nivelO2W - juego_.cantidadDescuentoNivelRojo;
        }
      }

      /*Rover queda atrapado un tiempo limitado; después se libera y puede volver a moverse como
      Astronauta*/
      if (this.atrapado == true && this.framesQuieto >= juego_.duracionAtrapadoFrames) 
      {
        this.atrapado = false;
        interferenciaActiva = false;
        this.framesQuieto = 0;
        this.columnaAnterior = this.columna;
        this.filaAnterior = this.fila;
      }
    }

    if (juego_.nivelO2W < 0) 
    {
      juego_.nivelO2W = 0;
    }
  }

  //método: dibuja astronauta o rover según esté atrapado o no
  dibujar() 
  {
    push();
    translate(this.x, this.y - 18);
    noStroke();

    if (this.atrapado == true) 
    {
      //Rover
      fill(200);
      rectMode(CENTER);
      rect(0, 8, 58, 28, 2);
      fill(60);
      circle(-23, 26, 15);
      circle(0, 26, 15);
      circle(23, 26, 15);
      fill(200);
      rect(0, -19, 19, 19, 2);
    } 
    else 
    {
      //Astronauta
      fill(255);
      rectMode(CENTER);
      rect(0, 16, 28, 43, 3);
      circle(0, -12, 38);
      fill(0);
      circle(0, -12, 19);
    }

    pop();
  }
}

//cae con rastro, no rebota, se desvía e impacta (o es interceptado) con sonido paneado
class Meteorito 
{
  constructor() 
  {
    this.activo = false;
    this.explotando = false;
    this.frameDeExplosion = 0;
    this.x = 0;
    this.y = 0;
    this.velocidadY = 3;
    this.radio = 22;

    //rastro: dos arrays paralelos con las posiciones anteriores (en vez de un array de objetos)
    this.rastroX = [];
    this.rastroY = [];
    this.largoRastro = 8;

    //celda puntual (fila y columna) elegida al azar como objetivo, y su "y" en pantalla
    this.filaObjetivo = 0;
    this.columnaObjetivo = 0;
    this.yObjetivo = 0;
  }

  /*método: activa el meteorito eligiendo una celda activa al azar de toda la plataforma 
  (no solo la superficie), así puede golpear bloques interiores también*/
  generar(juego_) 
  {
    this.activo = true;

    let celda = juego_.obtenerCeldaActivaAlAzar();
    this.filaObjetivo = celda[0];
    this.columnaObjetivo = celda[1];

    this.x = juego_.centroXPlataforma - (juego_.cantidadColumnas * juego_.tamañoBloque) / 2 + 
    (this.columnaObjetivo + 0.5) * juego_.tamañoBloque;

    this.y = -20;
    this.yObjetivo = juego_.centroYPlataforma - this.filaObjetivo * juego_.tamañoBloque;

    //vacía el rastro reutilizando el mismo array (en vez de crear uno nuevo cada vez)
    this.rastroX.length = 0;
    this.rastroY.length = 0;
  }

  //método: hace descender el meteorito y detecta el impacto contra su celda objetivo
  actualizar(juego_) 
  {
    if (this.activo == false) 
    {
      return;
    }

    this.rastroX.push(this.x);
    this.rastroY.push(this.y);
    if (this.rastroX.length > this.largoRastro) 
    {
      this.rastroX.shift();
      this.rastroY.shift();
    }

    this.y = this.y + this.velocidadY;

    if (this.y >= this.yObjetivo) 
    {
      this.y = this.yObjetivo;
      this.impactar(juego_);
    }
  }

  //método: resuelve el impacto (bloque o personaje), sonido paneado y sin rebote
  impactar(juego_) 
  {
    this.activo = false;
    this.explotando = true;
    this.frameDeExplosion = frameCount;

    let panorama = constrain(map(this.x, 0, 1280, -1, 1), -1, 1);

    if (this.columnaObjetivo == juego_.astronauta.columna && this.filaObjetivo == 
    juego_.astronauta.fila) 
    {
      muerteSer.pan(panorama, 0.05);
      muerteSer.stop();
      muerteSer.play();
      juego_.resultado = "DERROTA";
      juego_.detalleResultado = "Un meteorito te impactó directamente.";
      juego_.frameDeFin = frameCount;
      if (musica.isPlaying() == true) 
      {
        musica.amp(0.05, 0.05);
      }
    } 
    else 
    {
      if (frameCount - frameUltimoSonidoMeteorito >= 4) 
      {
        meteorito.pan(panorama, 0.05);
        meteorito.play();
        frameUltimoSonidoMeteorito = frameCount;
      }
      juego_.marcarBloqueado(this.filaObjetivo, this.columnaObjetivo);
    }
  }

  //método: el meteorito es desviado en el aire por un disparo, antes de impactar
  interceptar() 
  {
    this.activo = false;
    this.explotando = true;
    this.frameDeExplosion = frameCount;

    let panorama = constrain(map(this.x, 0, 1280, -1, 1), -1, 1);
    interceptar.pan(panorama, 0.05);
    interceptar.play();
  }

  //método: dibuja el rastro, el meteorito activo, y la explosión si corresponde
  dibujar() 
  {
    if (this.activo == true) 
    {
      push();
      noStroke();

      /*el alfa de cada segmento del rastro depende de su posición en la cola y cambia todo 
      el tiempo, así que se dibuja directo con el contexto nativo (mismo criterio que 
      estrellas/nebulosa) para no alocar un p5.Color nuevo por segmento y por frame*/
      drawingContext.fillStyle = "rgb(255, 170, 60)";
      for (let i = 0; i < this.rastroX.length; i = i + 1) 
      {
        let alfa = map(i, 0, this.rastroX.length, 20, 140);
        drawingContext.globalAlpha = alfa / 255;
        drawingContext.beginPath();
        drawingContext.arc(this.rastroX[i], this.rastroY[i], this.radio * 0.3, 0, TWO_PI);
        drawingContext.fill();
      }
      drawingContext.globalAlpha = 1;

      fill(255, 170, 60);
      circle(this.x, this.y, this.radio);
      fill(200, 120, 40);
      circle(this.x - 4, this.y - 3, this.radio * 0.3);
      pop();
    }

    if (this.explotando == true) 
    {
      let framesDesdeExplosion = frameCount - this.frameDeExplosion;

      if (framesDesdeExplosion < 15) 
      {
        push();
        noFill();
        stroke(255, 200, 150, map(framesDesdeExplosion, 0, 15, 255, 0));
        strokeWeight(3);
        circle(this.x, this.y, framesDesdeExplosion * 4);
        pop();
      } 
      else 
      {
        this.explotando = false;
      }
    }
  }
}

//emerge de un lado, sube en arco por encima de la plataforma y decae del otro lado
class Satelite
{
  constructor() 
  {
    this.anchoPantalla = 1280;
    this.yBase = 630;
    this.alturaArco = 350;
    this.duracionEnFrames = 900;
  }

  /*método: dibuja el satélite según los frames transcurridos desde que arrancó la partida achicándose 
  hacia el horizonte y agrandándose hacia la pantalla*/
  dibujar(framesTranscurridos_) 
  {
    let fase = framesTranscurridos_ % this.duracionEnFrames;
    let progreso = fase / this.duracionEnFrames;

    let x = map(progreso, 0, 1, -60, this.anchoPantalla + 60);
    let y = this.yBase - sin(progreso * PI) * this.alturaArco;
    let factorTamaño = 1 - sin(progreso * PI) * 0.4;

    push();
    translate(x, y);
    scale(factorTamaño);
    noStroke();
    fill(255);
    rectMode(CENTER);

    //paneles, mismo tamaño a cada lado
    rect(-16, 0, 20, 8);
    rect(16, 0, 20, 8);
    //cuerpo central, perpendicular a los paneles y más corto que la suma de ambos
    rect(0, 0, 10, 16);
    pop();
  }
}

//cruza una sola vez, aproximadamente a mitad de partida y anuncia el aumento de meteoritos
class Sonda
{
  constructor() 
  {
    this.anchoPantalla = 1280;
    this.y = 160;
    this.duracionEnFrames = 90;
    //cruza a mitad de partida: 30 segundos de 60 = frame 1800
    this.frameInicioSonda = 1800;
  }

  //método: dibuja la sonda solo dentro de su ventana de cruce
  dibujar(framesTranscurridos_) 
  {
    if (framesTranscurridos_ < this.frameInicioSonda) 
    {
      return;
    }

    let framesDesdeQueArranco = framesTranscurridos_ - this.frameInicioSonda;

    if (framesDesdeQueArranco > this.duracionEnFrames) 
    {
      return;
    }

    let progreso = framesDesdeQueArranco / this.duracionEnFrames;
    let x = map(progreso, 0, 1, -30, this.anchoPantalla + 30);

    push();
    noStroke();
    fill(255);
    circle(x, this.y, 14);

    stroke(255, 255, 255, 100);
    strokeWeight(2);
    line(x - 20, this.y, x - 6, this.y);
    pop();
  }
}

//Funciones auxiliares

/*cache de los colores de cada tipo de bloque: se crean una única vez (acá abajo), en vez de 
instanciar un p5.Color nuevo por bloque en cada frame dentro de colorDeTipo()*/
let coloresBloques = {};

function inicializarColoresBloques() 
{
  coloresBloques[TIPO_ROJO] = color(200, 70, 50);
  coloresBloques[TIPO_VERDE] = color(70, 180, 100);
  coloresBloques[TIPO_GRIS_CLARO] = color(210, 210, 218);
  coloresBloques[TIPO_GRIS_OSCURO] = color(55, 50, 48);
  coloresBloques[TIPO_VACIO] = color(0, 0, 0, 0);
}

/*cache de los colores por defecto de los botones: se crean una única vez para no 
instanciar un p5.Color nuevo por botón en cada frame dentro de dibujarBoton()*/
let colorNegroBoton;
let colorBlancoBoton;

function inicializarColoresBotones() 
{
  colorNegroBoton = color(0);
  colorBlancoBoton = color(255);
}

//devuelve el color de relleno según el tipo de bloque (cacheado, ver inicializarColoresBloques)
function colorDeTipo(tipo_) 
{
  return coloresBloques[tipo_];
}

/*dibuja un botón rectangular centrado en x_, y_. colorFondo_ y colorTexto_ son opcionales: 
si no se pasan, el botón queda como siempre (fondo negro, letras blancas)*/
function dibujarBoton(txt_, x_, y_, ancho_, alto_, colorFondo_, colorTexto_) 
{
  if (colorFondo_ == undefined) 
  {
    colorFondo_ = colorNegroBoton;
  }
  if (colorTexto_ == undefined) 
  {
    colorTexto_ = colorBlancoBoton;
  }

  push();
  translate(x_, y_);

  if(mouseOverRect(x_, y_, ancho_, alto_)) 
  {
    scale(1.03);
  }

  fill(colorFondo_);
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  rectMode(CENTER);
  rect(0, 0, ancho_, alto_, 6);
  textFont(fuenteBoton);
  textAlign(CENTER, CENTER);
  fill(colorTexto_);
  textSize(16);
  text(txt_, 0, 1);
  pop();
}

/*prende o apaga la pantalla completa pidiéndosela al canvas directamente (no a toda la 
página, que traía consigo elementos como el título de la pestaña) y estirándolo para 
que cubra toda la pantalla sin franjas negras*/
function alternarPantallaCompleta() 
{
  if (document.fullscreenElement) 
  {
    document.exitFullscreen();
  } 
  else 
  {
    lienzo.elt.requestFullscreen();
    lienzo.elt.style.width = "100vw";
    lienzo.elt.style.height = "100vh";
  }
}

/*dibuja un ícono cuadrado tipo toggle (música o pantalla completa), centrado en x_, y_,
con el mismo efecto de agrandado al pasar el mouse que los botones*/
function dibujarToggle(icono_, x_, y_, tamaño_) 
{
  push();
  translate(x_, y_);

  if (mouseOverRect(x_, y_, tamaño_, tamaño_)) 
  {
    scale(1.1);
  }

  imageMode(CENTER);
  image(icono_, 0, 0, tamaño_, tamaño_);
  pop();
}

//devuelve true si coincide la coordenada del mouse con zona rect
function mouseOverRect(x_centro_, y_centro_, ancho_, alto_) 
{
  return (mouseX > x_centro_-ancho_/2 && mouseX < x_centro_+ancho_/2 &&
  mouseY > y_centro_-alto_/2 && mouseY < y_centro_+alto_/2);
}

//lista de oraciones con íconos e instrucciones, inicializada una sola vez en setup()
let listaInstrucciones = [];

function inicializarInstrucciones() 
{
  listaInstrucciones = 
  [
    { icono: astroIcono, texto: "Usá las flechas del teclado para mover al Astronauta.", alto: 44 },
    { icono: miraIcono, texto: "Usá el mouse para mover la mira y disparar (mantené click para ráfaga).", alto: 44 },
    { icono: alertaIcono, texto: "Evitá pisar los bloques rojos y grises: te van a costar O2/W.", alto: 44 },
    { icono: saludIcono, texto: "Los bloques verdes estabilizan tu O2/W.", alto: 44 },
    { icono: meteoritoIcono, texto: "Los meteoritos son letales si te tocan y peligrosos para la plataforma.", alto: 44 },
    { icono: relojIcono, texto: "Sobreviví 60 segundos con O2/W mayor a cero.", alto: 44 }
  ];
}

/*cuadro de INSTRUCCIONES: a diferencia de dibujarCuadro() (que centra todo el bloque de texto), 
acá cada oración lleva su propio ícono a la izquierda y el texto alineado a la izquierda. El 
"alto" de cada oración es el espacio vertical que ocupa (más grande en la primera porque es 
la única que ocupa dos líneas)*/
function dibujarCuadroInstrucciones() 
{
  let ancho = 920;
  let alto = 300;

  push();
  translate(640, 310);
  fill(0, 0, 0, 230);
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  rectMode(CENTER);
  rect(0, 0, ancho, alto, 6);
  /*vuelve a CORNER: text() con ancho también usa el rectMode vigente, y con CENTER
  tomaba xTexto como el centro de la caja de texto en vez de como borde izquierdo*/
  rectMode(CORNER);

  let tamañoIcono = 32;
  let xIcono = -ancho/2 + 24;
  let xTexto = xIcono + tamañoIcono + 14;
  let anchoTexto = ancho/2 - 24 - xTexto;
  let yCursor = -alto/2 + 26;

  textFont(fuenteCuadro);
  textAlign(LEFT, TOP);
  fill(255);
  textSize(18);
  textLeading(34);
  imageMode(CORNER);

  for (let i = 0; i < listaInstrucciones.length; i = i + 1) 
  {
    image(listaInstrucciones[i].icono, xIcono, yCursor, tamañoIcono, tamañoIcono);
    describe(listaInstrucciones[i].icono.description);
    text(listaInstrucciones[i].texto, xTexto, yCursor, anchoTexto);
    yCursor = yCursor + listaInstrucciones[i].alto;
  }
  pop();
}

//dibuja un cuadro de texto con esquinas redondeadas de 6 px
function dibujarCuadro(txt_, x_, y_, ancho_, alto_)  
{
  push();
  translate(x_, y_);
  fill(0, 0, 0, 230);
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  rectMode(CENTER);
  rect(0, 0, ancho_, alto_, 6);

  textFont(fuenteCuadro);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(18);
  textLeading(34);
  text(txt_, 0, 0, ancho_-60);
  pop();
}

/*dibuja el puntero personalizado, tipo mira telescópica con halo 
(color de acento saturado para distinguirse de los bloques blancos)*/
function dibujaPuntero() 
{
  push();
  noFill();
  stroke(255, 100, 50, 220);
  strokeWeight(3);
  ellipse(mouseX, mouseY, 40, 40);

  noStroke();
  fill(255, 120, 60, 230);
  ellipse(mouseX, mouseY, 14, 14);
  pop();
}

//Verifica si el click cayó sobre un botón y cambia el estado
function chequearClick(x_, y_, ancho_, alto_, estadoDestino_)
{
  if(mouseOverRect(x_, y_, ancho_, alto_)) 
  {
    estado = estadoDestino_;
  }
}

/*guarda un puntaje nuevo (resultado, segundos sobrevividos, O2/W final, % de plataforma intacta y 
cantidad de meteoritos desviados) en localStorage: si ya existe un registro idéntico no lo duplica, 
ordena por segundos (con O2/W y plataforma como desempate) de mayor a menor y conserva solo los 
3 mejores*/
function guardarPuntaje(segundos_, resultado_, nivelO2W_, porcentajePlataforma_, cantidadDesviados_) 
{
  let lista = obtenerPuntajes();

  //si ya hay un puntaje guardado idéntico en los cinco datos, no se agrega una fila repetida
  let yaExiste = false;
  for (let i = 0; i < lista.length; i = i + 1) 
  {
    if (lista[i].segundos == segundos_ && lista[i].resultado == resultado_ && 
    lista[i].nivelO2W == nivelO2W_ && lista[i].porcentajePlataforma == porcentajePlataforma_ &&
    lista[i].cantidadDesviados == cantidadDesviados_) 
    {yaExiste = true;}
  }

  if (yaExiste) 
  {
    return;
  }

  lista.push
  ({
    segundos: segundos_,
    resultado: resultado_,
    nivelO2W: nivelO2W_,
    porcentajePlataforma: porcentajePlataforma_,
    cantidadDesviados: cantidadDesviados_
  });

  /*orden principal por el promedio de O2/W, % de plataforma y meteoritos desviados; empatado, 
  desempata segundos*/
  lista.sort(function(a_, b_) 
  {
    let promedioA = (a_.nivelO2W + a_.porcentajePlataforma + a_.cantidadDesviados) / 3;
    let promedioB = (b_.nivelO2W + b_.porcentajePlataforma + b_.cantidadDesviados) / 3;

    if (promedioB != promedioA) 
    {
      return promedioB - promedioA;
    }
    return b_.segundos - a_.segundos;
  });

  lista = lista.slice(0, 3);

  localStorage.setItem(CLAVE_PUNTAJES, JSON.stringify(lista));
}

/*lee la lista de puntajes guardados en este navegador (array vacío si no hay nada o 
el dato está corrupto)*/
function obtenerPuntajes() 
{
  let datos = localStorage.getItem(CLAVE_PUNTAJES);

  if (!datos) 
  {
    return [];
  }

  try 
  {
    let lista = JSON.parse(datos);
    if (!Array.isArray(lista)) 
    {
      return [];
    }

    /*normaliza puntajes guardados antes de sumar resultado, O2/W y plataforma 
    (venían como número suelto)*/
    for (let i = 0; i < lista.length; i = i + 1) 
    {
      if (typeof lista[i] == "number") 
      {
        lista[i] = 
        {
          segundos: lista[i],
          resultado: "",
          nivelO2W: null,
          porcentajePlataforma: null,
          cantidadDesviados: 0
        };
      }
      //normaliza puntajes guardados antes de sumar la cantidad de meteoritos desviados
      else if (lista[i].cantidadDesviados == undefined) 
      {
        lista[i].cantidadDesviados = 0;
      }
    }

    return lista;
  } 
  catch (error) 
  {
    return [];
  }
}