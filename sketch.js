//[CUBO] Parámetros configurables del sistema de cubos sólidos pseudo-3D
const CONFIG_CUBO = 
{
  altoTapa: 0.35,
  inclinacionLateral: 8,
  brilloTapa: 0.22,
  oscuridadLateral: 0.22,
  alphaSombra: 55,
  grosorSombra: 5,
  colorHorizonte: [10, 12, 24]
};

/*Móvil: constantes ajustables (valores en píxeles de pantalla, se pasan a 
coordenadas de canvas con el factor de escala). No afectan el escritorio*/
//Móvil: la velocidad se expresa como proporción del ancho del canvas por segundo.
let MIRA_RADIO_PANTALLA = 28;
let MIRA_TAMANO_PANTALLA = 28;
let MIRA_ESPERA_RAFAGA_MS = 150;

//Móvil: estado de pads y punteros (no se usa en escritorio)*/
let padPasoUsado = false;
let idPunteroMira = -1;
let miraPresionada = false;
let miraArrastrada = false;
let millisInicioMira = 0;
let aimX = 640;
let aimY = 360;

//[CUBO] Capa gráfica cacheada (p5.Graphics) para pre-renderizar los cubos con cero costo por frame
let bufferPlataforma;

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
relojIcono, saludIcono, miraIcono, monedaIcono, aurisIcono;

//recompensa en moneda (ASTRO$) según el puesto obtenido: primero, segundo y tercero
let RECOMPENSAS_PUESTO = [100, 60, 30];

//estrellas del fondo procedural, generadas una sola vez en setup()
let estrellas = [];


//control para evitar saturar el motor de audio con impactos de meteoritos casi simultáneos
let frameUltimoSonidoMeteorito = -10;

//control para el efecto de interferencia en la música cuando el astronauta está atrapado
let interferenciaActiva = false;
let frameUltimoCorteInterferencia = 0;
/*duración (en frames) del tramo actual de la interferencia, se sortea una sola vez por tramo 
para que los cortes sean irregulares como en una señal real y no un ritmo acelerado*/
let duracionTramoInterferencia = 10;
//ruido de estática que se mezcla con la música durante la interferencia
let ruidoInterferencia;
let ruidoActivo = false;
/*volumen de la estática del tramo actual y control de sus pequeños cortes: dentro de cada tramo 
la estática aparece en ráfagas breves de duración irregular, separadas por pequeños silencios*/
let volumenEstatica = 0;
let frameUltimoCorteEstatica = 0;
let duracionCorteEstatica = 0;
//volumen de la música según la pantalla: 0.3 en menús y más bajo en el juego (debajo de los efectos)
let volumenMusica = 0.3;

//posición de la mira (sigue al mouse directamente)
let miraX = 640;
let miraY = 360;

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

let flechaIzquierdaPresionada = false;
let wasdIzquierdaPresionada = false;
let flechaDerechaPresionada = false;
let wasdDerechaPresionada = false;
let flechaArribaPresionada = false;
let wasdArribaPresionada = false;
let flechaAbajoPresionada = false;
let wasdAbajoPresionada = false;

window.addEventListener("keydown", function(evento_) 
{
  if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
  {
    getAudioContext().resume();
  }

  if (evento_.code == "ArrowLeft" || evento_.code == "ArrowRight" || evento_.code == "ArrowUp" ||
  evento_.code == "ArrowDown" || evento_.code == "KeyW" || evento_.code == "KeyA" ||
  evento_.code == "KeyS" || evento_.code == "KeyD")
  {
    evento_.preventDefault();
  }
  if (evento_.code == "ArrowLeft")
  {
    flechaIzquierdaPresionada = true;
  }
  if (evento_.code == "KeyA")
  {
    wasdIzquierdaPresionada = true;
  }
  teclaIzquierdaPresionada = flechaIzquierdaPresionada || wasdIzquierdaPresionada;
  if (evento_.code == "ArrowRight")
  {
    flechaDerechaPresionada = true;
  }
  if (evento_.code == "KeyD")
  {
    wasdDerechaPresionada = true;
  }
  teclaDerechaPresionada = flechaDerechaPresionada || wasdDerechaPresionada;
  if (evento_.code == "ArrowUp")
  {
    flechaArribaPresionada = true;
  }
  if (evento_.code == "KeyW")
  {
    wasdArribaPresionada = true;
  }
  teclaArribaPresionada = flechaArribaPresionada || wasdArribaPresionada;
  if (evento_.code == "ArrowDown")
  {
    flechaAbajoPresionada = true;
  }
  if (evento_.code == "KeyS")
  {
    wasdAbajoPresionada = true;
  }
  teclaAbajoPresionada = flechaAbajoPresionada || wasdAbajoPresionada;
}, true);


window.addEventListener("keyup", function(evento_) 
{
  if (evento_.code == "ArrowLeft" || evento_.code == "ArrowRight" || evento_.code == "ArrowUp" ||
  evento_.code == "ArrowDown" || evento_.code == "KeyW" || evento_.code == "KeyA" ||
  evento_.code == "KeyS" || evento_.code == "KeyD")
  {
    evento_.preventDefault();
  }
  if (evento_.code == "ArrowLeft")
  {
    flechaIzquierdaPresionada = false;
  }
  if (evento_.code == "KeyA")
  {
    wasdIzquierdaPresionada = false;
  }
  teclaIzquierdaPresionada = flechaIzquierdaPresionada || wasdIzquierdaPresionada;
  if (evento_.code == "ArrowRight")
  {
    flechaDerechaPresionada = false;
  }
  if (evento_.code == "KeyD")
  {
    wasdDerechaPresionada = false;
  }
  teclaDerechaPresionada = flechaDerechaPresionada || wasdDerechaPresionada;
  if (evento_.code == "ArrowUp")
  {
    flechaArribaPresionada = false;
  }
  if (evento_.code == "KeyW")
  {
    wasdArribaPresionada = false;
  }
  teclaArribaPresionada = flechaArribaPresionada || wasdArribaPresionada;
  if (evento_.code == "ArrowDown")
  {
    flechaAbajoPresionada = false;
  }
  if (evento_.code == "KeyS")
  {
    wasdAbajoPresionada = false;
  }
  teclaAbajoPresionada = flechaAbajoPresionada || wasdAbajoPresionada;
}, true);

/*si la ventana pierde el foco (por ejemplo con Alt+Tab), se liberan las teclas para 
que el personaje no quede moviéndose solo y se suspende el audio para evitar buffer underruns*/
window.addEventListener("blur", function() 
{
  teclaIzquierdaPresionada = false;
  teclaDerechaPresionada = false;
  teclaArribaPresionada = false;
  teclaAbajoPresionada = false;

  flechaIzquierdaPresionada = false;
  wasdIzquierdaPresionada = false;
  flechaDerechaPresionada = false;
  wasdDerechaPresionada = false;
  flechaArribaPresionada = false;
  wasdArribaPresionada = false;
  flechaAbajoPresionada = false;
  wasdAbajoPresionada = false;
  actualizarOrientacionMovil();

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
  if (esTelefonoHorizontal() == false && esTelefonoVertical() == false) 
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
  }

  actualizarOrientacionMovil();
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
  astroIcono = loadImage("assets/movimiento.png", "Ícono del movimiento con flechas en 4 direcciones");
  meteoritoIcono = loadImage("assets/meteorito.png", "Ícono de un asteroide simple");
  musicaEncenderIcono = loadImage("assets/musica-encender.png", "Ícono de una nota musical");
  musicaApagarIcono = loadImage("assets/musica-apagar.png", "Ícono de una nota musical tachada");
  pantallaCompletaIcono = loadImage("assets/pantalla-completa.png", "Ícono de 4 flechas apuntando hacia el exterior");
  pantallaIncompletaIcono = loadImage("assets/pantalla-incompleta.png", "Ícono de 4 flechas apuntando hacia el interior");
  relojIcono = loadImage("assets/reloj.png", "Ícono de un reloj con botón superior");
  saludIcono = loadImage("assets/salud.png", "Ícono de un círculo con un signo más");
  miraIcono = loadImage("assets/telescopio.png", "Ícono de un telescopio con vista lateral");
  monedaIcono = loadImage("assets/moneda.png", "Ícono de una moneda de astros");
  aurisIcono = loadImage("assets/auris.png", "Ícono de unos auriculares");
}

function setup() 
{
  lienzo = createCanvas(1280, 720).parent('contenedorCanva');
  aplicarPixelDensityMovil();
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

  //[CUBO] Inicializa la capa gráfica cacheada de la plataforma de cubos
  crearBufferPlataforma();

  aplicarPixelDensityMovil();
  inicializarMovil();

  outputVolume(0.7);
  musica.setLoop(true);
  musica.amp(0.3);
  meteorito.amp(0.35);
  interceptar.amp(0.7);
  muerteSer.amp(0.6);

  /*ruido blanco (estática de señal de radio) que queda sonando en volumen 0 desde el inicio, así 
  solo se le cambia el volumen durante la interferencia y no se crean nodos nuevos cada vez*/
  ruidoInterferencia = new p5.Noise("white");
  ruidoInterferencia.amp(0);
  ruidoInterferencia.start();

  juego = new Juego();

  //[CUBO] Pre-renderiza la plataforma de cubos en la capa cacheada
  generarPlataformaCubo();
}

/*reproduce un efecto de sonido usando su mismo buffer y su misma salida (volumen y paneo 
de amp() y pan() se mantienen): play() de p5.sound crea un nodo interno nuevo en cada 
llamado que nunca se libera, y tras muchas reproducciones el audio se entrecorta y se silencia*/
function reproducirSonido(sonido, factorVolumen = 1) 
{
  let contexto = getAudioContext();
  let fuente = contexto.createBufferSource();
  fuente.buffer = sonido.buffer;

  /*cada reproducción pasa por su propia ganancia, así un sonido lejano no le baja el 
  volumen a otro cercano que esté sonando al mismo tiempo*/
  let ganancia = contexto.createGain();
  ganancia.gain.value = factorVolumen;
  fuente.connect(ganancia);
  ganancia.connect(sonido.output);
  fuente.onended = function () 
  {
    ganancia.disconnect();
  };
  fuente.start();
}

/*volumen según la distancia al astronauta: al lado suena al nivel actual (1) y se va 
atenuando hasta un mínimo audible (0.3) a partir de los 700 px de distancia*/
function factorVolumenPorDistancia(x_, y_, juego_) 
{
  let astronauta = juego_.astronauta;
  let distancia = dist(x_, y_, astronauta.x, astronauta.y);
  return constrain(map(distancia, 0, 700, 1, 0.3), 0.3, 1);
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

    estrellas.push
    ({
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

//fondo procedural: cielo, nebulosa grisácea, estrellas titilando y viñeta.
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

/*nebulosa: varios cúmulos de partículas grises superpuestas con mezcla aditiva, como una 
nube tenue vista a ojo desde un telescopio (no una forma geométrica lisa)*/
let nebulosas = [];

/*vetas de polvo oscuras que se dibujan encima de la nebulosa, sin mezcla aditiva, para que la 
nube no quede como una mancha de color pareja*/
let filamentos = [];

function generarNebulosas() 
{
  /*todos los cúmulos son grises neutros (rojo, verde y azul iguales): la nebulosa no debe 
  competir con los colores del juego y se ve como la percibe el ojo humano desde un telescopio*/

  /*cada cúmulo mezcla grises oscuros y grises claros, así la nube tiene zonas más densas y 
  luminosas junto a zonas apagadas en vez de un gris medio parejo*/

  //cúmulo lejano: grande, difuso, cubre buena parte del cielo, mayoría de grises oscuros
  nebulosas.push(crearCumulo(360, 220, 560, 65, 
  [color(46, 46, 46), color(58, 58, 58), color(150, 150, 150), color(52, 52, 52)], 0.16, 0.0025));

  //cúmulo cercano: más chico y más denso, mezcla pareja de oscuros y claros
  nebulosas.push(crearCumulo(820, 260, 340, 36, 
  [color(60, 60, 60), color(176, 176, 176), color(70, 70, 70), color(190, 190, 190)], 0.32, 0.004));

  //tercer cúmulo, más chico y con más grises claros, para reforzar la profundidad
  nebulosas.push(crearCumulo(980, 400, 200, 20, 
  [color(200, 200, 200), color(66, 66, 66), color(184, 184, 184)], 0.4, 0.006));

  /*dos cúmulos más, del lado izquierdo y arriba a la derecha, para que la nebulosa cubra 
  bastante más cielo y no se sienta concentrada en un solo sector*/
  nebulosas.push(crearCumulo(150, 520, 320, 29, 
  [color(48, 48, 48), color(160, 160, 160), color(56, 56, 56)], 0.2, 0.003));

  nebulosas.push(crearCumulo(1100, 140, 280, 26, 
  [color(170, 170, 170), color(54, 54, 54), color(64, 64, 64)], 0.24, 0.0035));

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

  //cúmulos, con mezcla aditiva (como una nube tenue vista a ojo desde un telescopio)
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
  en vez de sumarlo: es lo que rompe la mancha gris pareja y le da textura más real*/
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

  /*teléfono en vertical: el modal HTML cubre la pantalla y la partida no avanza 
  (se corre frameDeInicio para que el cronómetro no gaste tiempo oculto)*/
  if (esTelefonoVertical() == true) 
  {
    if (juego != undefined && estado == ESTADO_JUEGO && juego.resultado == "") 
    {
      juego.frameDeInicio = juego.frameDeInicio + 1;
    }
    return;
  }

  //efecto de interferencia en la música cuando el astronauta está atrapado (rover)
  if (interferenciaActiva == true && musica.isPlaying() == true) 
  {
    /*entrecortado simulando pérdida de señal sin usar pause/play: la señal se alterna entre 
    tramos de duración irregular y el volumen solo cambia al empezar cada tramo (no en cada frame)*/
    if (frameCount - frameUltimoCorteInterferencia >= duracionTramoInterferencia) 
    {
      let sorteo = random(0, 1);

      if (sorteo < 0.35) 
      {
        //corte completo de la señal: la música desaparece y queda solo la estática
        musica.amp(0.0, 0.02);
        volumenEstatica = volumenMusica * 0.25;
        duracionTramoInterferencia = floor(random(6, 20));
      }
      else if (sorteo < 0.7) 
      {
        //señal débil: música muy baja tapada por la estática
        musica.amp(volumenMusica * random(0.15, 0.35), 0.02);
        volumenEstatica = volumenMusica * 0.18;
        duracionTramoInterferencia = floor(random(8, 24));
      }
      else 
      {
        //recuperación parcial: la música vuelve y la estática queda de fondo
        musica.amp(volumenMusica * random(0.6, 0.9), 0.05);
        volumenEstatica = volumenMusica * 0.07;
        duracionTramoInterferencia = floor(random(12, 30));
      }

      ruidoActivo = true;
      frameUltimoCorteInterferencia = frameCount;
    }

    /*estática breve e irregular: ráfagas cortas de intensidad variable separadas por pequeños 
    cortes, el volumen solo cambia al empezar cada ráfaga o corte (no en cada frame)*/
    if (frameCount - frameUltimoCorteEstatica >= duracionCorteEstatica) 
    {
      if (random(0, 1) < 0.4) 
      {
        //pequeño corte: la estática se silencia un instante
        ruidoInterferencia.amp(0, 0.005);
        duracionCorteEstatica = floor(random(1, 4));
      }
      else 
      {
        //ráfaga breve de estática
        ruidoInterferencia.amp(volumenEstatica * random(0.6, 1), 0.005);
        duracionCorteEstatica = floor(random(2, 7));
      }

      frameUltimoCorteEstatica = frameCount;
    }
  } 
  else if (interferenciaActiva == false && musica.isPlaying() == true && 
  abs(musica.getVolume() - volumenMusica) > 0.01) 
  {
    //restaurar volumen normal cuando no hay interferencia
    musica.amp(volumenMusica, 0.2);
  }

  //silenciar la estática una sola vez al terminar la interferencia o al apagar la música
  if ((interferenciaActiva == false || musica.isPlaying() == false) && ruidoActivo == true) 
  {
    ruidoInterferencia.amp(0, 0.1);
    ruidoActivo = false;
    duracionTramoInterferencia = 0;
    duracionCorteEstatica = 0;
  }

  limpiarPasoPadMovimientoMovil();

  switch(estado) 
  {
    case ESTADO_MENU:
      dibujarFondo();

      push();
      fill(255);
      textFont(fuenteBoton);
      textAlign(CENTER, CENTER);
      textSize(36);
      text("UMBRAL", 640, 220);
      pop();

      /*toggles a los costados del título: música a la izquierda, pantalla completa a la derecha.
      Quedan alineados con el ancho del botón JUGAR (320 de ancho, centrado en 640): el borde 
      izquierdo del de música coincide con el izquierdo de JUGAR (480) y el borde derecho del 
      de pantalla completa coincide con el derecho de JUGAR (800)*/
      dibujarToggle(musica.isPlaying() ? musicaApagarIcono : musicaEncenderIcono, 500, 226, 40);
      dibujarToggle(document.fullscreenElement ? pantallaIncompletaIcono : pantallaCompletaIcono, 
      780, 226, 40);

      dibujarBoton("JUGAR", 640, 291, 320, 48, color(224, 205, 170), color(0));

      dibujarBoton("PUNTAJES", 640, 357, 320, 48);
      dibujarBoton("INSTRUCCIONES", 640, 423, 320, 48);
      dibujarBoton("CRÉDITOS", 640, 489, 320, 48);
    break;

    case ESTADO_INSTRUCCIONES:
      dibujarFondo();
      dibujarBoton("ATRÁS", 640, 617, 320, 48, 0);
      dibujarCuadroInstrucciones();
    break;

    case ESTADO_CREDITOS:
      dibujarFondo();
      dibujarBoton("ATRÁS", 640, 445, 320, 48, 0);

      /*la oración larga se corta a mano en dos líneas y el ancho del cuadro se ajusta a la línea 
      más larga más el margen lateral de dibujarCuadro() (30 a cada lado), equivalente al vertical*/
      let lineasCreditos = ["Autoría: Daniel Toledo", 
      "Este minijuego representa la capacidad tecnológica humana actual", 
      "para explorar el universo, y también sus límites físicos al enfrentarlo."];
      push();
      textFont(fuenteCuadro);
      textSize(18);
      let anchoCreditos = 0;
      for (let i = 0; i < lineasCreditos.length; i = i + 1) 
      {
        anchoCreditos = max(anchoCreditos, textWidth(lineasCreditos[i]));
      }

      dibujarCuadro("", 640, 324, ceil(anchoCreditos) + 60, 146);
      textAlign(CENTER, CENTER);
      fill(255);
      noStroke();
      for (let i = 0; i < lineasCreditos.length; i = i + 1) 
      {
        text(lineasCreditos[i], 640, 290 + i * 34);
      }
      pop();
    break;

    case ESTADO_PUNTAJES:
      dibujarFondo();
      dibujarBoton("ATRÁS", 640, 492, 320, 48, 0);

      //arma el texto con los 3 mejores puntajes guardados en este navegador ("—" si falta alguno)
      let listaPuntajes = obtenerPuntajes();
      let textoPuntajes = "MEJORES PUNTAJES\n";

      //texto de cada puesto por separado, para ubicar el ícono de moneda al final de cada línea
      let lineasPuntajes = ["", "", ""];

      for (let i = 0; i < 3; i = i + 1) 
      {
        let datoPuntaje = listaPuntajes[i];
        lineasPuntajes[i] = (i + 1) + ". ";

        if (datoPuntaje == undefined) 
        {
          lineasPuntajes[i] = lineasPuntajes[i] + "—";
        } 
        else if (datoPuntaje.resultado == "") 
        {
          //puntaje viejo, normalizado en obtenerPuntajes() pero sin resultado/O2/W/plataforma
          lineasPuntajes[i] = lineasPuntajes[i] + datoPuntaje.segundos + " segundos";
        } 
        else 
        {
          /*solo se muestra el promedio y los ASTRO$ que corresponden a ese puesto (el ícono de 
          moneda se agrega después, al final de la línea)*/
          let promedioPuntaje = round((datoPuntaje.nivelO2W + datoPuntaje.porcentajePlataforma + 
          datoPuntaje.cantidadDesviados) / 3);
          lineasPuntajes[i] = lineasPuntajes[i] + promedioPuntaje + " · " + RECOMPENSAS_PUESTO[i] + 
          " ASTRO$";
        }

        /*en el cuadro solo queda el título y un renglón vacío por puesto, las líneas se dibujan 
        después alineadas a la izquierda para que empiecen todas desde el número*/
        textoPuntajes = textoPuntajes + " ";

        if (i < 2) 
        {
          textoPuntajes = textoPuntajes + "\n";
        }
      }

      /*el ancho del cuadro se ajusta a la línea más larga (incluido el ícono de moneda, sumado 
      a ambos lados para que el texto siga centrado) más el mismo margen lateral en cada lado*/
      push();
      textFont(fuenteCuadro);
      textSize(18);
      let anchoNumero = max(textWidth("1. "), textWidth("2. "), textWidth("3. "));
      let anchoContenido = textWidth("MEJORES PUNTAJES");
      //ancho del bloque de líneas (con su ícono de moneda), para centrarlo como un todo
      let anchoLineas = 0;
      for (let i = 0; i < 3; i = i + 1) 
      {
        let anchoLinea = anchoNumero + textWidth(lineasPuntajes[i].substring(3));
        if (listaPuntajes[i] != undefined && listaPuntajes[i].resultado != "") 
        {
          anchoLinea = anchoLinea + 32 + 12;
        }
        anchoLineas = max(anchoLineas, anchoLinea);
      }
      anchoContenido = max(anchoContenido, anchoLineas);
      pop();
      //mismo margen lateral que el vertical (240 de alto menos el bloque de 4 líneas, dividido 2)
      let margenLateralPuntajes = 45;
      let anchoCuadroPuntajes = anchoContenido + margenLateralPuntajes * 2;

      dibujarCuadro(textoPuntajes, 640, 324, anchoCuadroPuntajes, 240, 44);

      /*cada puesto alineado a la izquierda desde el mismo x (todas las líneas empiezan en el 
      número), con el ícono de moneda al final de cada puesto que tenga un puntaje con promedio*/
      let xInicioLineas = 640 - anchoLineas/2;
      push();
      textFont(fuenteCuadro);
      textSize(18);
      /*el 1 es más angosto que el 2 y el 3 en la fuente, por eso la oración que le seguía 
      arrancaba a distinto x: los números se dibujan aparte en su propia columna y las 
      oraciones quedan todas alineadas desde el mismo x*/
      textAlign(LEFT, CENTER);
      fill(255);
      noStroke();
      for (let i = 0; i < 3; i = i + 1) 
      {
        //el número arranca en el mismo x que los demás y el punto va pegado a él
        text(i + 1, xInicioLineas, 302 + i * 44);
        text(". ", xInicioLineas + textWidth(i + 1), 302 + i * 44);
        text(lineasPuntajes[i].substring(3), xInicioLineas + anchoNumero, 302 + i * 44);

        if (listaPuntajes[i] != undefined && listaPuntajes[i].resultado != "") 
        {
          //dibujarMoneda() toma x_ como el centro de la línea
          dibujarMoneda(lineasPuntajes[i].substring(3), xInicioLineas + anchoNumero +
          textWidth(lineasPuntajes[i].substring(3))/2, 302 + i * 44);
        }
      }
      pop();
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
        limpiarPasoPadMovimientoMovil();
        juego.actualizarMeteoritos(framesTranscurridos);
        if (esTelefonoHorizontal() == true) 
        {
          actualizarDisparoMovil();
        } 
        else 
        {
          juego.actualizarDisparo();
        }
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

          //guardarPuntaje() devuelve el puesto obtenido (0, 1 o 2) o -1 si quedó fuera del top 3
          juego.puestoObtenido = guardarPuntaje(segundosSobrevividos, juego.resultado, juego.nivelO2W, 
          porcentajeIntactaFinal, juego.cantidadDesviados);
        }
      }

      //[CUBO] Durante la vibración de impacto (6 frames) se dibuja dinámicamente; luego se usa la capa pre-renderizada
      if (frameCount - juego.frameVibra < 6) 
      {
        juego.dibujarPlataforma();
      } 
      else if (bufferPlataforma) 
      {
        image(bufferPlataforma, 0, 0);
      } 
      else 
      {
        juego.dibujarPlataforma();
      }
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
      //el verde se ancla a la derecha, así el rojo crece de izquierda a derecha
      fill(60, 200, 90);
      rect(bateriaX + bateriaAncho * (1 - fraccionO2W), bateriaY, bateriaAncho * fraccionO2W, bateriaAlto);
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
        //el gris claro termina siempre arriba, así el gris oscuro crece desde arriba en sentido horario
        arc(circuloX, circuloY, circuloRadio * 2, circuloRadio * 2, -HALF_PI + 
        (1 - fraccionIntacta) * TWO_PI, -HALF_PI + TWO_PI, PIE);
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

        let lineaSobreviviste = "Sobreviviste " + segundosJugados + " segundos.";
        let textoResultado;

        //sin "VICTORIA"/"DERROTA": la cita y su autora van debajo de la frase que corresponde
        if (juego.resultado == "VICTORIA") 
        {
          textoResultado = lineaSobreviviste + 
          "\n\"El cuerpo humano está hecho para la Tierra.\"" + 
          "\nNoel de Castro · Ingeniera biomédica";
        } 
        else if (juego.detalleResultado == "Te quedaste sin O2/W.") 
        {
          textoResultado = juego.detalleResultado + 
          "\n\"En el espacio los recursos son limitados.\"" + 
          "\nMaría Fernanda Mora · Química analítica" + 
          "\n" + lineaSobreviviste;
        } 
        else 
        {
          textoResultado = juego.detalleResultado + 
          "\n\"El peso es todo en el espacio.\"" + 
          "\nClara O'Farrell · Ingeniera mecánica y aeroespacial" + 
          "\n" + lineaSobreviviste;
        }

        //si ganó y entró al top 3, se suma la recompensa en ASTRO$ según el puesto
        let lineaRecompensa = "";
        if (juego.resultado == "VICTORIA" && juego.puestoObtenido != -1) 
        {
          lineaRecompensa = "Puesto " + (juego.puestoObtenido + 1) + ": ganaste " + 
          RECOMPENSAS_PUESTO[juego.puestoObtenido] + " ASTRO$";
          textoResultado = textoResultado + "\n" + lineaRecompensa;
        }

        /*máximo 4 líneas (igual que antes con la recompensa), así el alto y los márgenes 
        verticales no cambian; se ensancha para que la línea de la autora no se corte*/
        dibujarCuadro(textoResultado, 640, 327, 640, 230);

        if (lineaRecompensa != "") 
        {
          dibujarMoneda(lineaRecompensa, 640, 327 + 51);
        }
        dibujarBoton("JUGAR DE NUEVO", 640, 469, 320, 48, 0);
        dibujarBoton("INICIO", 640, 535, 320, 48, 0);
      }
    break;
  }

  dibujaPuntero();
  limpiarPasoPadMovimientoMovil();
}

//se llama una única vez por click (sirve para los botones del menú)
function mousePressed(evento_)
{
  if (esTelefono() == true && evento_ != undefined &&
  (evento_.pointerId == undefined || lienzo == undefined || evento_.target != lienzo.elt))
  {
    return;
  }
  if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
  {
    getAudioContext().resume();
  }

  //Móvil: zona de detección más amplia alrededor de los toggles (el dibujo sigue en 40)
  let zonaToggle = esTelefono() ? 72 : 40;

  switch(estado) 
  {
    case ESTADO_MENU:
      if(mouseOverRect(500, 226, zonaToggle, zonaToggle))
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
          musica.amp(volumenMusica, 0.1);
        }
      }

      if(mouseOverRect(780, 226, zonaToggle, zonaToggle))
      {
        alternarPantallaCompleta();
      }

      if(mouseOverRect(640, 291, 320, 48))
      {
        //frameCount para la partida arranca acá, no antes
        juego.frameDeInicio = frameCount;
        juego.reiniciar();
        estado = ESTADO_JUEGO;
      }

      chequearClick(640, 357, 320, 48, ESTADO_PUNTAJES);
      chequearClick(640, 423, 320, 48, ESTADO_INSTRUCCIONES);
      chequearClick(640, 489, 320, 48, ESTADO_CREDITOS);
    break;

    case ESTADO_INSTRUCCIONES:
      chequearClick(640, 617, 320, 48, ESTADO_MENU);
    break;

    case ESTADO_CREDITOS:
      chequearClick(640, 445, 320, 48, ESTADO_MENU);
    break;

    case ESTADO_PUNTAJES:
      chequearClick(640, 492, 320, 48, ESTADO_MENU);
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
          volumenMusica = 0.3;
          if (musica.isPlaying() == true) 
          {
            musica.amp(volumenMusica, 0.1);
          }
          estado = ESTADO_MENU;
        }
      }
    break;
  }
}

/*Móvil: toma las coordenadas del toque sobre el canvas escalado. Los botones HTML
conservan su click y no activan los botones dibujados dentro del juego.*/
function touchStarted(evento_)
{
  if (esTelefono() == false || lienzo == undefined || evento_ == undefined ||
  evento_.target != lienzo.elt)
  {
    return true;
  }
  return false;
}

//[CUBO] Regenera la capa cacheada si cambia el tamaño de la ventana
function windowResized() 
{
  if (typeof generarPlataformaCubo === "function") 
  {
    generarPlataformaCubo();
  }
  aplicarPixelDensityMovil();
  actualizarOrientacionMovil();
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
    //[CUBO] 6 filas para no superar la mitad de la pantalla (y <= 360)
    this.cantidadFilasPlataforma = 6;
    this.cantidadActivaInicial = 26;
    this.decrementoPorFila = 2;
    this.centroXPlataforma = 640;
    this.centroYPlataforma = 720;
    this.filas = [];
    this.generarFilas();

    /*vibración localizada: celda (fila y columna) del último impacto y frame en que ocurrió, 
    para sacudir solo esa celda y al personaje si está cerca durante unos pocos frames*/
    this.filaVibra = 0;
    this.columnaVibra = 0;
    this.frameVibra = -100;

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

    //puesto obtenido en la tabla al ganar (0, 1 o 2), -1 si no entró al top 3
    this.puestoObtenido = -1;

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

    //[CUBO] Actualiza la plataforma de cubos si se regeneran las filas
    if (typeof generarPlataformaCubo === "function") 
    {
      generarPlataformaCubo();
    }
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
    volumenMusica = 0.12;

    if (musica.isPlaying() == true) 
    {
      musica.amp(volumenMusica, 0.1);
    }

    this.generarFilas();
    this.nivelO2W = 90;
    this.resultado = "";
    this.detalleResultado = "";
    this.puestoObtenido = -1;
    this.frameDeFin = 0;
    this.totalCeldasActivas = this.contarCeldasActivas();
    this.cantidadBloqueadas = 0;
    this.generarPoolMeteoritos();
    this.frameUltimoMeteorito = 0;
    this.proximoFrameDisparo = 0;
    this.cantidadDesviados = 0;
    this.astronauta = new Astronauta(floor(this.cantidadColumnas / 2), this);

    //[CUBO] Sincroniza la plataforma de cubos con la nueva partida
    if (typeof generarPlataformaCubo === "function") 
    {
      generarPlataformaCubo();
    }
  }

  //[CUBO] Devuelve la coordenada Y de la superficie (tapa superior) de una fila
  obtenerYFila(fila_) 
  {
    let W = this.tamañoBloque;
    let altoTapa = round(W * CONFIG_CUBO.altoTapa);
    let paso = W + altoTapa;
    return this.centroYPlataforma - (fila_ - 1) * paso - W;
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

  /*[CUBO] Dibuja todas las filas de la plataforma con cubos pseudo-3D,
  recorriendo de la más lejana (arriba) a la más cercana (abajo) para oclusión correcta*/
  dibujarPlataforma() 
  {
    for (let i = this.filas.length - 1; i >= 0; i = i - 1) 
    {
      this.filas[i].dibujar();
    }
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

    this.filaVibra = fila_;
    this.columnaVibra = columna_;
    this.frameVibra = frameCount;

    // [CUBO] Actualiza la plataforma al bloquearse una celda
    if (typeof generarPlataformaCubo === "function") 
    {
      generarPlataformaCubo();
    }
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

    // [CUBO] Actualiza la plataforma al reubicarse el bloque verde
    if (typeof generarPlataformaCubo === "function") 
    {
      generarPlataformaCubo();
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

      if (m.activo == true && m.desviado == false && dist(m.x, m.y, miraX, miraY) < this.radioDisparo) 
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

  //[CUBO] Dibuja esta fila como cubos sólidos pseudo-3D
  dibujar() 
  {
    let W = this.tamañoBloque;
    let altoTapa = round(W * CONFIG_CUBO.altoTapa);
    let paso = W + altoTapa;
    let yFront = this.centroY - (this.numeroDeFila - 1) * paso - W;
    let yTapa = yFront - altoTapa;
    let totalFilas = juego ? juego.filas.length : 8;
    let factorAtm = (this.numeroDeFila - 1) / (totalFilas - 1);
    let cHorizonte = color(CONFIG_CUBO.colorHorizonte[0], CONFIG_CUBO.colorHorizonte[1], CONFIG_CUBO.colorHorizonte[2]);

    noStroke();

    for (let columna = 0; columna < this.cantidadColumnas; columna = columna + 1) 
    {
      if (this.bloques[columna] != TIPO_VACIO) 
      {
        let posX = this.centroX - (this.cantidadColumnas * W) / 2 + columna * W;

        // Vibración de impacto
        let distanciaVibra = abs(juego.filaVibra - this.numeroDeFila) + abs(juego.columnaVibra - columna);
        let vibraX = 0;
        let vibraY = 0;
        if (frameCount - juego.frameVibra < 6 && distanciaVibra < 4) 
        {
          let intensidadVibra = 1 - distanciaVibra / 4;
          vibraX = random(-5, 5) * intensidadVibra;
          vibraY = random(-4, 4) * intensidadVibra;
        }

        let cBase = colorDeTipo(this.bloques[columna]);
        let cBaseAtm = lerpColor(cBase, cHorizonte, factorAtm * 0.45);
        let cFrontal = cBaseAtm;
        let factorBrilloTapa = CONFIG_CUBO.brilloTapa * (1 - factorAtm * 0.35);
        let cTapa = lerpColor(cBaseAtm, color(255), factorBrilloTapa);
        let factorOscuridadLat = CONFIG_CUBO.oscuridadLateral * (1 - factorAtm * 0.35);
        let cLateral = lerpColor(cBaseAtm, color(0), factorOscuridadLat);

        let esExtremoIzq = (columna == this.columnaInicio);
        let esExtremoDer = (columna == this.columnaFin - 1);
        let incLat = CONFIG_CUBO.inclinacionLateral;

        let xTL = posX + vibraX + (esExtremoIzq ? incLat : 0);
        let xTR = posX + W + vibraX - (esExtremoDer ? incLat : 0);
        let xBL = posX + vibraX;
        let xBR = posX + W + vibraX;

        // 1. Cara frontal (cuadrado)
        fill(cFrontal);
        rect(posX + vibraX, yFront + vibraY, W, W);

        // 2. Tapa superior (techo recto al centro, inclinado en celdas laterales finales)
        fill(cTapa);
        quad(xTL, yTapa + vibraY, xTR, yTapa + vibraY, xBR, yFront + vibraY, xBL, yFront + vibraY);

        // 3. Aristas de 1 px
        fill(lerpColor(cTapa, color(255), 0.3));
        rect(xTL, yTapa + vibraY, xTR - xTL, 1);
        if (esExtremoIzq) 
        {
          quad(xBL, yFront + vibraY, xBL + 1, yFront + vibraY, xTL + 1, yTapa + vibraY, xTL, yTapa + vibraY);
        }
        if (esExtremoDer) 
        {
          quad(xBR - 1, yFront + vibraY, xBR, yFront + vibraY, xTR, yTapa + vibraY, xTR - 1, yTapa + vibraY);
        }
        fill(lerpColor(cFrontal, color(0), 0.35));
        rect(posX + vibraX, yFront + W - 1 + vibraY, W, 1);
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
    this.direccion = "ABAJO";
    this.x = 0;
    this.y = 0;
    this.atrapado = false;
    //tipo de bloque que está pisando, para decidir qué traje usar (o seguir como Rover)
    this.tipoPisado = TIPO_GRIS_CLARO;
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

    if (frameCount < this.proximoFrameMovimiento && padPasoUsado == false) 
    {
      return;
    }

    let columnaDeseada = this.columna;
    let filaDeseada = this.fila;

    if (teclaArribaPresionada == true) 
    {
      filaDeseada = this.fila + 1;
      this.direccion = "ARRIBA";
    }
    if (teclaAbajoPresionada == true) 
    {
      filaDeseada = this.fila - 1;
      this.direccion = "ABAJO";
    }
    if (teclaIzquierdaPresionada == true) 
    {
      columnaDeseada = this.columna - 1;
      this.direccion = "IZQUIERDA";
    }
    if (teclaDerechaPresionada == true) 
    {
      columnaDeseada = this.columna + 1;
      this.direccion = "DERECHA";
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

    //no se puede pisar una celda bloqueada (gris oscuro) ni vacía (fuera de la pirámide)
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

    //[CUBO] Asienta al astronauta sobre la tapa superior del cubo
    this.y = juego_.obtenerYFila(this.fila);
  }

  //método: aplica el descuento de O2/W según el bloque pisado y cuánto tiempo lleva ahí
  actualizarNivel(juego_) 
  {
    let tipoActual = juego_.obtenerTipoDeCelda(this.fila, this.columna);
    this.tipoPisado = tipoActual;

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
  /*al liberarse sigue como Rover mientras esté sobre el bloque rojo, y recién al moverse cambia 
  al traje del bloque que pisa*/
  dibujar() 
  {
    //sombra de contacto sobre la superficie, para asentar al personaje en la plataforma
    push();
    noStroke();
    fill(0, 0, 0, 90);
    ellipse(this.x, this.y - 3, 34, 8);
    pop();

    /*vibración breve en función de la distancia al impacto: máxima en su celda y menor 
    cuanto más lejos, hasta desaparecer a 4 columnas*/
    let vibraX = 0;
    let vibraY = 0;
    let distanciaVibra = abs(juego.columnaVibra - this.columna);
    if (frameCount - juego.frameVibra < 8 && distanciaVibra < 4) 
    {
      let intensidadVibra = 1 - distanciaVibra / 4;
      vibraX = random(-3, 3) * intensidadVibra;
      vibraY = random(-2, 2) * intensidadVibra;
    }

    push();
    translate(this.x + vibraX, this.y - 18 + vibraY);
    noStroke();

    if (this.atrapado == true || this.tipoPisado == TIPO_ROJO) 
    {
      //Rover sincronizado con la dirección del movimiento
      //franja, cámaras (sensores) y bandera en el chasis emulando al RoverTito argentino
      fill(200);
      rectMode(CENTER);

      if (this.direccion == "ARRIBA") 
      {
        //vista trasera del rover: franja
        rect(0, 8, 46, 28, 2);
        fill(60);
        circle(-20, 26, 15);
        circle(20, 26, 15);
        fill(150);
        rect(0, 8, 26, 10, 1);
        fill(116, 172, 223);
        rect(0, 16, 46, 4);
      } 
      else if (this.direccion == "ABAJO") 
      {
        //vista frontal del rover: franja y 2 cámaras (sensores)
        rect(0, 8, 46, 28, 2);
        fill(60);
        circle(-20, 26, 15);
        circle(20, 26, 15);
        fill(116, 172, 223);
        rect(0, 12, 46, 5);
        //carcasa de cada cámara con su lente oscura y un brillo chico
        fill(40);
        rect(-9, 1, 13, 10, 2);
        rect(9, 1, 13, 10, 2);
        fill(0);
        circle(-9, 1, 7);
        circle(9, 1, 7);
        fill(116, 172, 223);
        circle(-10, 0, 2);
        circle(8, 0, 2);
      } 
      else if (this.direccion == "IZQUIERDA") 
      {
        //vista lateral izquierda: franja y bandera en el chasis
        rect(0, 8, 58, 28, 2);
        fill(60);
        circle(-23, 26, 15);
        circle(0, 26, 15);
        circle(23, 26, 15);
        fill(116, 172, 223);
        rect(0, 12, 58, 5);
        this.dibujarBandera(10, 2, 10, 8);
      } 
      else 
      {
        //vista lateral derecha (DERECHA): franja (la bandera queda del otro lado)
        rect(0, 8, 58, 28, 2);
        fill(60);
        circle(-23, 26, 15);
        circle(0, 26, 15);
        circle(23, 26, 15);
        fill(116, 172, 223);
        rect(0, 12, 58, 5);
      }
    } 
    else 
    {
      //Astronauta según la dirección del movimiento
      /*en bloques verdes traje naranja con casco blanco y visor negro, en bloques grises traje y 
      casco blancos con visor dorado*/
      let colorTraje = color(255);
      let colorVisor = color(212, 175, 55);
      if (this.tipoPisado == TIPO_VERDE) 
      {
        colorTraje = color(240, 120, 30);
        colorVisor = color(0);
      }

      rectMode(CENTER);

      if (this.direccion == "ARRIBA") 
      {
        //vista de espaldas: todo blanco con tanque de oxígeno como rectángulo simple
        fill(colorTraje);
        rect(0, 16, 28, 43, 3);
        fill(255);
        circle(0, -12, 38);
        //con el traje naranja la espalda queda lisa, sin el tanque
        if (this.tipoPisado != TIPO_VERDE) 
        {
          fill(200);
          rect(0, 16, 18, 28, 2);
        }
      } 
      else if (this.direccion == "IZQUIERDA") 
      {
        //vista de perfil a la izquierda: tanque lateral detrás y visor negro de costado
        //bandera en el brazo izquierdo
        //con el traje naranja el costado queda liso, sin el tanque
        if (this.tipoPisado != TIPO_VERDE) 
        {
          fill(200);
          rect(13, 16, 8, 28, 2);
        }
        fill(colorTraje);
        rect(0, 16, 24, 43, 3);
        fill(255);
        circle(0, -12, 38);
        fill(colorVisor);
        rect(-10, -12, 10, 18, 4);
        this.dibujarBandera(2, 13, 7, 6);
      } 
      else if (this.direccion == "DERECHA") 
      {
        //vista de perfil a la derecha: tanque lateral detrás y visor negro de costado
        //con el traje naranja el costado queda liso, sin el tanque
        if (this.tipoPisado != TIPO_VERDE) 
        {
          fill(200);
          rect(-13, 16, 8, 28, 2);
        }
        fill(colorTraje);
        rect(0, 16, 24, 43, 3);
        fill(255);
        circle(0, -12, 38);
        fill(colorVisor);
        rect(10, -12, 10, 18, 4);
      } 
      else 
      {
        //vista de frente (ABAJO), tal como está originalmente
        fill(colorTraje);
        rect(0, 16, 28, 43, 3);
        fill(255);
        circle(0, -12, 38);
        fill(colorVisor);
        circle(0, -12, 19);
      }
    }

    pop();
  }

  //método: dibuja una bandera argentina chica (celeste, blanco y celeste con sol) centrada en x_, y_
  dibujarBandera(x_, y_, ancho_, alto_) 
  {
    fill(116, 172, 223);
    rect(x_, y_, ancho_, alto_);
    fill(255);
    rect(x_, y_, ancho_, alto_ / 3);
    fill(246, 180, 14);
    circle(x_, y_, alto_ / 4);
  }
}

//cae con rastro, no rebota, se desvía e impacta (o es interceptado) con sonido paneado
class Meteorito 
{
  constructor() 
  {
    this.activo = false;
    this.desviado = false;
    this.velocidadX = 0;
    this.explotando = false;
    this.frameDeExplosion = 0;
    this.x = 0;
    this.y = 0;
    this.velocidadY = 3.5;
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
    this.desviado = false;
    this.velocidadX = 0;
    this.velocidadY = 3.5;

    let celda = juego_.obtenerCeldaActivaAlAzar();
    this.filaObjetivo = celda[0];
    this.columnaObjetivo = celda[1];

    this.x = juego_.centroXPlataforma - (juego_.cantidadColumnas * juego_.tamañoBloque) / 2 + 
    (this.columnaObjetivo + 0.5) * juego_.tamañoBloque;

    this.y = -20;
    //[CUBO] El meteorito impacta sobre la tapa superior del cubo objetivo
    this.yObjetivo = juego_.obtenerYFila(this.filaObjetivo);

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

    if (this.desviado == true) 
    {
      this.x = this.x + this.velocidadX;
      this.y = this.y + this.velocidadY;

      //cuando sale completamente de la pantalla por los costados o por abajo, se desactiva
      if (this.x < -60 || this.x > 1280 + 60 || this.y > 720 + 60) 
      {
        this.activo = false;
        this.desviado = false;
      }
      return;
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
      juego_.filaVibra = this.filaObjetivo;
      juego_.columnaVibra = this.columnaObjetivo;
      juego_.frameVibra = frameCount;
      juego_.frameDeFin = frameCount;
      volumenMusica = 0.05;
      if (musica.isPlaying() == true) 
      {
        musica.amp(volumenMusica, 0.05);
      }
    } 
    else 
    {
      if (frameCount - frameUltimoSonidoMeteorito >= 4) 
      {
        meteorito.pan(panorama, 0.05);
        reproducirSonido(meteorito, factorVolumenPorDistancia(this.x, this.y, juego_));
        frameUltimoSonidoMeteorito = frameCount;
      }
      juego_.marcarBloqueado(this.filaObjetivo, this.columnaObjetivo);
    }
  }

  //método: el meteorito es desviado hacia los costados de la pantalla por un disparo, antes de impactar
  interceptar() 
  {
    this.desviado = true;

    //si está en la mitad izquierda se desvía a la izquierda, y si está en la derecha a la derecha
    if (this.x < 640) 
    {
      this.velocidadX = -8;
    } 
    else 
    {
      this.velocidadX = 8;
    }

    this.velocidadY = 2;

    let panorama = constrain(map(this.x, 0, 1280, -1, 1), -1, 1);
    interceptar.pan(panorama, 0.05);
    reproducirSonido(interceptar, factorVolumenPorDistancia(this.x, this.y, juego));
  }

  //método: dibuja el rastro, el meteorito activo, y la explosión si corresponde
  dibujar() 
  {
    if (this.activo == true) 
    {
      push();
      noStroke();

      /*sombra en la celda objetivo: crece y se oscurece a medida que el meteorito se acerca, 
      así se lee la profundidad y se anticipa dónde va a caer (no cambia la caída)*/
      if (this.desviado == false) 
      {
        let cercania = constrain(map(this.y, -20, this.yObjetivo, 0, 1), 0, 1);
        fill(0, 0, 0, 30 + cercania * 90);
        ellipse(this.x, this.yObjetivo - 3, 10 + cercania * 26, 3 + cercania * 6);
      }

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

//[CUBO] Inicializa el buffer offscreen para pre-renderizar los cubos sólidos
function crearBufferPlataforma() 
{
  bufferPlataforma = createGraphics(width, height);
  bufferPlataforma.pixelDensity(pixelDensity());
}

//[CUBO] Pre-renderiza la pirámide de cubos pseudo-3D sólidos en la capa cacheada
function generarPlataformaCubo() 
{
  if (!bufferPlataforma || !juego || !juego.filas || juego.filas.length == 0) 
  {
    return;
  }

  bufferPlataforma.clear();
  bufferPlataforma.noStroke();

  let filas = juego.filas;
  let totalFilas = filas.length;
  let W = juego.tamañoBloque;
  let Ncols = juego.cantidadColumnas;
  let centroX = juego.centroXPlataforma;
  let centroY = juego.centroYPlataforma;

  let altoTapa = round(W * CONFIG_CUBO.altoTapa);
  let paso = W + altoTapa;
  let grosorSombra = CONFIG_CUBO.grosorSombra;
  let alphaSombra = CONFIG_CUBO.alphaSombra;
  let cHorizonte = color(CONFIG_CUBO.colorHorizonte[0], CONFIG_CUBO.colorHorizonte[1], CONFIG_CUBO.colorHorizonte[2]);

  //[CUBO] Orden de dibujado: de la fila más lejana (arriba) a la más cercana (abajo)
  for (let k = totalFilas; k >= 1; k = k - 1) 
  {
    let f = filas[k - 1];
    let yFront = centroY - (k - 1) * paso - W;
    let yTapa = yFront - altoTapa;

    //Perspectiva atmosférica por fila (0 = más cercana, 1 = más lejana)
    let factorAtm = (k - 1) / (totalFilas - 1);

    //[CUBO] Dentro de cada fila, de izquierda a derecha
    for (let col = 0; col < Ncols; col = col + 1) 
    {
      let tipo = f.bloques[col];
      if (tipo == TIPO_VACIO) 
      {
        continue;
      }

      let posX = centroX - (Ncols * W) / 2 + col * W;
      let cBase = colorDeTipo(tipo);

      //Color base atenuado con perspectiva atmosférica hacia colorHorizonte
      let cBaseAtm = lerpColor(cBase, cHorizonte, factorAtm * 0.45);

      //Tono frontal (color base de tono medio)
      let cFrontal = cBaseAtm;

      //Tono tapa superior: el más claro (+18–25% de luminosidad hacia blanco)
      let factorBrilloTapa = CONFIG_CUBO.brilloTapa * (1 - factorAtm * 0.35);
      let cTapa = lerpColor(cBaseAtm, color(255), factorBrilloTapa);

      //Tono lateral: más oscuro (-20–25% de luminosidad hacia negro)
      let factorOscuridadLat = CONFIG_CUBO.oscuridadLateral * (1 - factorAtm * 0.35);
      let cLateral = lerpColor(cBaseAtm, color(0), factorOscuridadLat);

      let esExtremoIzq = (col == f.columnaInicio);
      let esExtremoDer = (col == f.columnaFin - 1);
      let incLat = CONFIG_CUBO.inclinacionLateral;

      let xTL = posX + (esExtremoIzq ? incLat : 0);
      let xTR = posX + W - (esExtremoDer ? incLat : 0);
      let xBL = posX;
      let xBR = posX + W;

      //1. CARA FRONTAL: cuadrado, de frente, sin inclinación
      bufferPlataforma.fill(cFrontal);
      bufferPlataforma.rect(posX, yFront, W, W);

      //2. TAPA SUPERIOR: techo recto al centro, inclinado en celdas laterales finales
      bufferPlataforma.fill(cTapa);
      bufferPlataforma.quad(xTL, yTapa, xTR, yTapa, xBR, yFront, xBL, yFront);

      //3. ARISTAS: 1 px más clara en borde superior de la tapa y 1 px más oscura en base frontal (sin contornos negros)
      let cAristaTapa = lerpColor(cTapa, color(255), 0.3);
      bufferPlataforma.fill(cAristaTapa);
      bufferPlataforma.rect(xTL, yTapa, xTR - xTL, 1);
      if (esExtremoIzq) 
      {
        bufferPlataforma.quad(xBL, yFront, xBL + 1, yFront, xTL + 1, yTapa, xTL, yTapa);
      }
      if (esExtremoDer) 
      {
        bufferPlataforma.quad(xBR - 1, yFront, xBR, yFront, xTR, yTapa, xTR - 1, yTapa);
      }

      let cAristaBase = lerpColor(cFrontal, color(0), 0.35);
      bufferPlataforma.fill(cAristaBase);
      bufferPlataforma.rect(posX, yFront + W - 1, W, 1);
    }

    //4. SOMBRA DE CONTACTO:
    //Dibujada DESPUÉS de la tapa de la terraza inferior (fila k) y ANTES de la siguiente,
    //4 franjas de 3 px (12 px total) con alpha 120, 85, 50 y 20 alineadas con el borde de la tapa inferior
    if (k < totalFilas) 
    {
      let xInicioFila = centroX - (Ncols * W) / 2 + f.columnaInicio * W;
      let xFinFila = centroX - (Ncols * W) / 2 + f.columnaFin * W;
      let incLat = CONFIG_CUBO.inclinacionLateral;

      //Atenuación atmosférica: reduce el alpha solo un 25% en las terrazas lejanas
      let atenuacionAtm = 1 - 0.25 * (k / (totalFilas - 1));

      let dx0 = round(incLat * (1 - 0 / altoTapa));
      bufferPlataforma.fill(0, 0, 0, round(120 * atenuacionAtm));
      bufferPlataforma.rect(xInicioFila + dx0, yTapa, (xFinFila - dx0) - (xInicioFila + dx0), 3);

      let dx1 = round(incLat * (1 - 3 / altoTapa));
      bufferPlataforma.fill(0, 0, 0, round(85 * atenuacionAtm));
      bufferPlataforma.rect(xInicioFila + dx1, yTapa + 3, (xFinFila - dx1) - (xInicioFila + dx1), 3);

      let dx2 = round(incLat * (1 - 6 / altoTapa));
      bufferPlataforma.fill(0, 0, 0, round(50 * atenuacionAtm));
      bufferPlataforma.rect(xInicioFila + dx2, yTapa + 6, (xFinFila - dx2) - (xInicioFila + dx2), 3);

      let dx3 = round(incLat * (1 - 9 / altoTapa));
      bufferPlataforma.fill(0, 0, 0, round(20 * atenuacionAtm));
      bufferPlataforma.rect(xInicioFila + dx3, yTapa + 9, (xFinFila - dx3) - (xInicioFila + dx3), 3);
    }
  }
}

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
  else if (esTelefono() == true)
  {
    document.querySelector("#game-wrapper").requestFullscreen();
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
    /*movimiento.png, telescopio.png y auris.png no son cuadradas (más anchas que altas): respetarProporcion 
    hace que se dibujen con su proporción real en vez de aplastadas en un cuadrado*/
    { icono: astroIcono, titulo: "Movimiento", 
    texto: esTelefono() ? "Usá los pads para mover al astronauta/rover." : 
    "Usá las flechas o las teclas (W,A,S,D) para mover al astronauta/rover.", respetarProporcion: true },
    { icono: miraIcono, titulo: "Disparo", 
    texto: esTelefono() ? "Mové la mira con el dedo y mantené presionado para disparar en ráfaga." : 
    "Mové la mira con el mouse y mantené click para disparar en ráfaga.", respetarProporcion: true },
    { icono: alertaIcono, titulo: "Bloques peligrosos", 
    texto: "Evitá los bloques rojos y grises: consumen O2/W." },
    { icono: saludIcono, titulo: "Bloques verdes", 
    texto: "Estabilizan tu O2/W." },
    { icono: meteoritoIcono, titulo: "Meteoritos", 
    texto: "Son letales si te tocan y pueden colapsar la plataforma." },
    { icono: relojIcono, titulo: "Objetivo", 
    texto: "Sobreviví 60 segundos con O2/W por encima de cero." },
    { icono: aurisIcono, titulo: "Opcional", 
    texto: "Se recomienda usar auriculares para una mejor experiencia.", respetarProporcion: true, escala: 0.72 }
  ];
}

/*cuadro de INSTRUCCIONES: a diferencia de dibujarCuadro() (que centra todo el bloque de texto), 
acá cada instrucción lleva su ícono y título en una línea y la explicación en la línea de abajo, 
alineada con el título*/
function dibujarCuadroInstrucciones() 
{
  let margen = 24;
  let separacionLineas = 24;
  let altoInstruccion = 66;
  let altoLinea = 22;
  let tamañoIcono = 32;

  /*el ancho del cuadro se ajusta al título o explicación más larga, así el margen lateral 
  derecho queda igual al izquierdo y al vertical (margen)*/
  push();
  textSize(18);
  let anchoContenido = 0;
  for (let i = 0; i < listaInstrucciones.length; i = i + 1) 
  {
    textFont(fuenteBoton);
    anchoContenido = max(anchoContenido, textWidth(listaInstrucciones[i].titulo));
    textFont(fuenteCuadro);
    anchoContenido = max(anchoContenido, textWidth(listaInstrucciones[i].texto));
  }
  pop();
  anchoContenido = ceil(anchoContenido);

  let ancho = margen + tamañoIcono + 14 + anchoContenido + margen;
  let alto = margen * 2 + (listaInstrucciones.length - 1) * altoInstruccion + separacionLineas + altoLinea;

  push();
  translate(640, 324);
  fill(0, 0, 0, 230);
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  rectMode(CENTER);
  rect(0, 0, ancho, alto, 6);
  /*vuelve a CORNER: text() con ancho también usa el rectMode vigente, y con CENTER
  tomaba xTexto como el centro de la caja de texto en vez de como borde izquierdo*/
  rectMode(CORNER);

  let xIcono = -ancho/2 + margen;
  let xTexto = xIcono + tamañoIcono + 14;
  let anchoTexto = ancho/2 - margen - xTexto;
  let yCursor = -alto/2 + margen;

  textFont(fuenteCuadro);
  textAlign(LEFT, TOP);
  fill(255);
  textSize(18);
  textLeading(34);
  imageMode(CORNER);

  for (let i = 0; i < listaInstrucciones.length; i = i + 1) 
  {
    let instruccion = listaInstrucciones[i];
    let icono = instruccion.icono;
    let anchoIcono = tamañoIcono;
    let altoIcono = tamañoIcono;
    if (instruccion.respetarProporcion && icono.height > 0) 
    {
      //se achican un poco porque su dibujo ocupa casi todo el alto de la imagen y se veían más grandes
      altoIcono = tamañoIcono * (instruccion.escala || 0.8);
      anchoIcono = altoIcono * icono.width / icono.height;
    }
    //centrado sobre el mismo eje que los íconos de 32 px y a la altura del título
    let xIconoCentrado = xIcono - (anchoIcono - tamañoIcono) / 2;
    let yIcono = yCursor + altoLinea / 2 - altoIcono / 2;
    image(icono, xIconoCentrado, yIcono, anchoIcono, altoIcono);
    if (icono == miraIcono) 
    {
      push();
      stroke(255);
      strokeWeight(1);
      line(xIconoCentrado + anchoIcono * 0.28, yIcono + altoIcono / 2,
      xIconoCentrado + anchoIcono * 0.47, yIcono + altoIcono / 2);
      line(xIconoCentrado + anchoIcono * 0.53, yIcono + altoIcono / 2,
      xIconoCentrado + anchoIcono * 0.72, yIcono + altoIcono / 2);
      pop();
    }
    describe(icono.description);

    textFont(fuenteBoton);
    text(instruccion.titulo, xTexto, yCursor);

    textFont(fuenteCuadro);
    text(instruccion.texto, xTexto, yCursor + separacionLineas);
    yCursor = yCursor + altoInstruccion;
  }
  pop();
}

//dibuja un cuadro de texto con esquinas redondeadas de 6 px
function dibujarCuadro(txt_, x_, y_, ancho_, alto_, interlineado_)  
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
  textLeading(interlineado_ || 34);
  text(txt_, 0, 0, ancho_-60);
  pop();
}

/*dibuja el ícono de moneda justo después de una línea de texto centrada en x_ (mide el ancho 
de la línea con la misma fuente y tamaño que usa dibujarCuadro())*/
function dibujarMoneda(linea_, x_, y_) 
{
  let tamañoIcono = 32;

  push();
  textFont(fuenteCuadro);
  textSize(18);
  imageMode(CORNER);
  /*recorta los márgenes transparentes de moneda.png (la moneda ocupa solo el centro de la imagen), 
  y la dibuja con el mismo tamaño y modo que los íconos de INSTRUCCIONES*/
  image(monedaIcono, x_ + textWidth(linea_)/2 + 12, y_ - tamañoIcono/2, tamañoIcono, tamañoIcono, 
  258, 8, 564, 569);
  pop();
}

/*dibuja el puntero personalizado, tipo mira telescópica con halo 
(color de acento saturado para distinguirse de los bloques blancos)*/
function dibujaPuntero() 
{
  if (esTelefonoHorizontal() == false && esTelefonoVertical() == false) 
  {
    miraX = mouseX;
    miraY = mouseY;
  }

  if (esTelefonoHorizontal() == true)
  {
    miraX = aimX;
    miraY = aimY;
  }

  let diametroHalo = 40;
  let diametroCentro = 14;
  if (esTelefonoHorizontal() == true) 
  {
    let escala = factorEscalaCanvas();
    diametroHalo = MIRA_TAMANO_PANTALLA * escala;
    if (diametroHalo < 24 * escala) 
    {
      diametroHalo = 24 * escala;
    }
    diametroCentro = diametroHalo * 0.35;
  }

  push();
  noFill();
  stroke(255, 100, 50, 220);
  strokeWeight(3);
  ellipse(miraX, miraY, diametroHalo, diametroHalo);

  noStroke();
  fill(255, 120, 60, 230);
  ellipse(miraX, miraY, diametroCentro, diametroCentro);
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
ordena por promedio de mayor a menor (sin desempate: ante promedios iguales queda primero el 
que entró antes), conserva solo los 3 mejores y devuelve el puesto obtenido (0, 1 o 2) o -1 
si quedó fuera*/
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

  //el registro idéntico ya guardado conserva su puesto: el nuevo no entra al ranking
  if (yaExiste) 
  {
    return -1;
  }

  lista.push
  ({
    segundos: segundos_,
    resultado: resultado_,
    nivelO2W: nivelO2W_,
    porcentajePlataforma: porcentajePlataforma_,
    cantidadDesviados: cantidadDesviados_
  });

  /*orden únicamente por el promedio (redondeado, el mismo número que se ve en PUNTAJES) de O2/W, 
  % de plataforma y meteoritos desviados. Sin desempate: sort() mantiene el orden previo entre 
  promedios iguales, y como el nuevo puntaje se agrega al final, el que entró primero conserva 
  su puesto y uno igual nunca puede reemplazarlo*/
  lista.sort(function(a_, b_) 
  {
    let promedioA = round((a_.nivelO2W + a_.porcentajePlataforma + a_.cantidadDesviados) / 3);
    let promedioB = round((b_.nivelO2W + b_.porcentajePlataforma + b_.cantidadDesviados) / 3);

    return promedioB - promedioA;
  });

  lista = lista.slice(0, 3);

  localStorage.setItem(CLAVE_PUNTAJES, JSON.stringify(lista));

  return buscarPuesto(lista, segundos_, resultado_, nivelO2W_, porcentajePlataforma_, cantidadDesviados_);
}

//devuelve la posición (0, 1 o 2) de un puntaje dentro de la lista, o -1 si no está
function buscarPuesto(lista_, segundos_, resultado_, nivelO2W_, porcentajePlataforma_, cantidadDesviados_) 
{
  for (let i = 0; i < lista_.length; i = i + 1) 
  {
    if (lista_[i].segundos == segundos_ && lista_[i].resultado == resultado_ && 
    lista_[i].nivelO2W == nivelO2W_ && lista_[i].porcentajePlataforma == porcentajePlataforma_ &&
    lista_[i].cantidadDesviados == cantidadDesviados_) 
    {return i;}
  }
  return -1;
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

//Móvil: detección, modal, pads y mira. No altera el disparo de escritorio.

function esTelefonoVertical() 
{
  return window.matchMedia("(pointer: coarse) and (orientation: portrait) and (max-width: 500px)").matches;
}

function esTelefonoHorizontal() 
{
  return window.matchMedia("(pointer: coarse) and (orientation: landscape) and (max-height: 500px)").matches;
}

function esTelefono() 
{
  if (esTelefonoVertical() == true || esTelefonoHorizontal() == true) 
  {
    return true;
  }
  return false;
}

function aplicarPixelDensityMovil() 
{
  if (esTelefono() == true) 
  {
    pixelDensity(1);
  }
}

function factorEscalaCanvas() 
{
  if (lienzo == undefined || lienzo.elt == undefined) 
  {
    return 1;
  }
  let anchoMostrado = lienzo.elt.clientWidth;
  if (anchoMostrado <= 0) 
  {
    return 1;
  }
  return width / anchoMostrado;
}

function actualizarOrientacionMovil() 
{
  aplicarPixelDensityMovil();
  idPunteroMira = -1;
  miraPresionada = false;
  miraArrastrada = false;
  if (esTelefonoHorizontal() == true)
  {
    aimX = constrain(aimX, 0, width);
    aimY = constrain(aimY, 0, height);
  }
}

function limpiarPasoPadMovimientoMovil() 
{
  if (padPasoUsado == false) 
  {
    return;
  }
  teclaArribaPresionada = false;
  teclaAbajoPresionada = false;
  teclaIzquierdaPresionada = false;
  teclaDerechaPresionada = false;
  padPasoUsado = false;
}

function radioAciertoMovil() 
{
  return MIRA_RADIO_PANTALLA * factorEscalaCanvas();
}

function intentarDesvioMovil(desdeX_, desdeY_, unoSolo_) 
{
  if (juego == undefined || estado != ESTADO_JUEGO || juego.resultado != "") 
  {
    return;
  }

  let radio = radioAciertoMovil();
  for (let i = 0; i < juego.meteoritos.length; i = i + 1) 
  {
    let m = juego.meteoritos[i];
    let cercaX = aimX;
    let cercaY = aimY;
    if (desdeX_ != undefined && desdeY_ != undefined)
    {
      let dx = aimX - desdeX_;
      let dy = aimY - desdeY_;
      let largo = dx * dx + dy * dy;
      if (largo > 0)
      {
        let tramo = constrain(((m.x - desdeX_) * dx + (m.y - desdeY_) * dy) / largo, 0, 1);
        cercaX = desdeX_ + dx * tramo;
        cercaY = desdeY_ + dy * tramo;
      }
    }
    if (m.activo == true && m.desviado == false && dist(m.x, m.y, cercaX, cercaY) < radio) 
    {
      m.interceptar();
      juego.cantidadDesviados = juego.cantidadDesviados + 1;
      disparoX = m.x;
      disparoY = m.y;
      frameDisparo = frameCount;
      if (unoSolo_ == true)
      {
        break;
      }
    }
  }
}

function actualizarDisparoMovil() 
{
  if (miraPresionada == true && (miraArrastrada == true ||
  millis() - millisInicioMira >= MIRA_ESPERA_RAFAGA_MS)) 
  {
    intentarDesvioMovil();
  }
}

function actualizarMiraDesdeEvento(evento_) 
{
  let caja = lienzo.elt.getBoundingClientRect();
  if (caja.width <= 0 || caja.height <= 0)
  {
    return;
  }
  aimX = constrain((evento_.clientX - caja.left) * width / caja.width, 0, width);
  aimY = constrain((evento_.clientY - caja.top) * height / caja.height, 0, height);
  miraX = aimX;
  miraY = aimY;
  mouseX = aimX;
  mouseY = aimY;
}

function inicializarMiraMovil() 
{
  if (lienzo == undefined || lienzo.elt == undefined)
  {
    return;
  }
  lienzo.elt.addEventListener("pointerdown", function(evento_)
  {
    if (esTelefonoHorizontal() == false || idPunteroMira != -1 ||
    document.querySelector("#modalInfo").classList.contains("abierto"))
    {
      return;
    }
    evento_.preventDefault();
    idPunteroMira = evento_.pointerId;
    lienzo.elt.setPointerCapture(evento_.pointerId);
    actualizarMiraDesdeEvento(evento_);
    mousePressed(evento_);
    miraPresionada = true;
    miraArrastrada = false;
    millisInicioMira = millis();
    intentarDesvioMovil(undefined, undefined, true);
  });
  lienzo.elt.addEventListener("pointermove", function(evento_)
  {
    if (evento_.pointerId != idPunteroMira || esTelefonoHorizontal() == false)
    {
      return;
    }
    evento_.preventDefault();
    let desdeX = aimX;
    let desdeY = aimY;
    actualizarMiraDesdeEvento(evento_);
    if (aimX != desdeX || aimY != desdeY)
    {
      miraArrastrada = true;
      intentarDesvioMovil(desdeX, desdeY);
    }
  });
  lienzo.elt.addEventListener("pointerup", soltarMira);
  lienzo.elt.addEventListener("pointercancel", soltarMira);
  lienzo.elt.addEventListener("lostpointercapture", soltarMira);

  function soltarMira(evento_)
  {
    if (evento_.pointerId != idPunteroMira)
    {
      return;
    }
    idPunteroMira = -1;
    miraPresionada = false;
    miraArrastrada = false;
  }
}

function direccionPadDesdeEvento(pad_, evento_, permitirDiagonal_) 
{
  let caja = pad_.getBoundingClientRect();
  let dx = evento_.clientX - (caja.left + caja.width / 2);
  let dy = evento_.clientY - (caja.top + caja.height / 2);
  let zona = Math.min(caja.width, caja.height) * 0.1;
  let arriba = false;
  let abajo = false;
  let izquierda = false;
  let derecha = false;

  if (Math.sqrt(dx * dx + dy * dy) > zona)
  {
    let angulo = Math.atan2(dy, dx);
    if (permitirDiagonal_ == true)
    {
      let sector = (Math.round(angulo / (Math.PI / 4)) + 8) % 8;
      arriba = (sector == 5 || sector == 6 || sector == 7);
      abajo = (sector == 1 || sector == 2 || sector == 3);
      izquierda = (sector == 3 || sector == 4 || sector == 5);
      derecha = (sector == 7 || sector == 0 || sector == 1);
    }
    else
    {
      let sector = (Math.round(angulo / (Math.PI / 2)) + 4) % 4;
      arriba = (sector == 3);
      abajo = (sector == 1);
      izquierda = (sector == 2);
      derecha = (sector == 0);
    }
  }

  return [arriba, abajo, izquierda, derecha];
}

function aplicarPasoMovimientoPad(dirs_) 
{
  teclaArribaPresionada = false;
  teclaAbajoPresionada = false;
  teclaIzquierdaPresionada = false;
  teclaDerechaPresionada = false;
  if (dirs_[0] == true) 
  {
    teclaArribaPresionada = true;
  }
  if (dirs_[1] == true) 
  {
    teclaAbajoPresionada = true;
  }
  if (dirs_[2] == true) 
  {
    teclaIzquierdaPresionada = true;
  }
  if (dirs_[3] == true) 
  {
    teclaDerechaPresionada = true;
  }
  padPasoUsado = true;
  if (juego != undefined && estado == ESTADO_JUEGO && juego.resultado == "")
  {
    juego.astronauta.moverse(juego);
  }
  limpiarPasoPadMovimientoMovil();
}

function inicializarPad(pad_) 
{
  if (pad_ == null) 
  {
    return;
  }
  let idPuntero = -1;
  pad_.addEventListener("contextmenu", function(evento_) 
  {
    evento_.preventDefault();
  });
  pad_.addEventListener("pointerdown", function(evento_) 
  {
    evento_.preventDefault();
    evento_.stopPropagation();
    if (esTelefonoHorizontal() == false || idPuntero != -1 ||
    document.querySelector("#modalInfo").classList.contains("abierto"))
    {
      return;
    }
    if (typeof getAudioContext == "function" && getAudioContext().state != "running") 
    {
      getAudioContext().resume();
    }
    idPuntero = evento_.pointerId;
    pad_.setPointerCapture(evento_.pointerId);
    aplicarPasoMovimientoPad(direccionPadDesdeEvento(pad_, evento_, false));
  });
  pad_.addEventListener("pointerup", soltarPad);
  pad_.addEventListener("pointercancel", soltarPad);
  pad_.addEventListener("lostpointercapture", soltarPad);

  function soltarPad(evento_) 
  {
    if (evento_.pointerId != idPuntero)
    {
      return;
    }
    idPuntero = -1;
  }
}

function inicializarMovil() 
{
  let btnInfo = document.querySelector("#btnInfo");
  let modalInfo = document.querySelector("#modalInfo");
  let btnCerrarInfo = document.querySelector("#btnCerrarInfo");
  if (btnInfo != null && modalInfo != null) 
  {
    btnInfo.addEventListener("click", function() 
    {
      actualizarOrientacionMovil();
      modalInfo.classList.add("abierto");
    });
  }
  if (btnCerrarInfo != null && modalInfo != null) 
  {
    btnCerrarInfo.addEventListener("click", function() 
    {
      modalInfo.classList.remove("abierto");
    });
  }

  inicializarPad(document.querySelector("#padMovimiento"));
  inicializarPad(document.querySelector("#padMovimientoDerecho"));
  inicializarMiraMovil();

  if (lienzo != undefined && lienzo.elt != undefined) 
  {
    lienzo.elt.addEventListener("contextmenu", function(evento_) 
    {
      evento_.preventDefault();
    });
  }

  let uiMovil = document.querySelector("#uiMovil");
  if (uiMovil != null) 
  {
    uiMovil.addEventListener("contextmenu", function(evento_) 
    {
      evento_.preventDefault();
    });
  }

  if (window.matchMedia) 
  {
    let consultaHorizontal = window.matchMedia("(orientation: landscape)");
    if (consultaHorizontal.addEventListener) 
    {
      consultaHorizontal.addEventListener("change", actualizarOrientacionMovil);
    }
  }

  window.addEventListener("orientationchange", actualizarOrientacionMovil);
  actualizarOrientacionMovil();
}
