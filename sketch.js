/*Tipos de bloque de la plataforma, no hay bloque dado que no se puede pisar ni hay 
superficie ahi (define el "hueco" de la pirámide y los bordes de cada fila)*/
let TIPO_VACIO = 0; 
let TIPO_ROJO = 1;
let TIPO_VERDE = 2;
let TIPO_GRIS_CLARO = 3;
let TIPO_GRIS_OSCURO = 4;

//Estados de pantalla (para no perderse con los numeros sueltos)
let ESTADO_MENU = 0;
let ESTADO_INSTRUCCIONES = 1;
let ESTADO_CREDITOS = 2;
let ESTADO_JUEGO = 3;

//Objeto principal del juego
let juego;

//Variables para cargar los archivos:
let fondo, musica, interceptar, meteorito, muerteSer, fuenteBoton, fuenteCuadro;

/*Control de teclado propio (no depende de keyIsDown de p5): se registra en fase de
captura sobre window, asi el preventDefault llega antes que cualquier otro manejador
de la pagina que pudiera estar comiendose el evento.*/
let teclaIzquierdaPresionada = false;
let teclaDerechaPresionada = false;
let teclaArribaPresionada = false;
let teclaAbajoPresionada = false;

window.addEventListener("keydown", function(evento_) 
{
  if (evento_.code == "ArrowLeft" || evento_.code == "ArrowRight" || evento_.code == "ArrowUp" || evento_.code == "ArrowDown") 
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

function preload() 
{
  fondo = loadImage("assets/universo.gif");

  musica = loadSound("assets/musica.mp3");
  interceptar = loadSound("assets/destruir-meteorito.mp3");
  meteorito = loadSound("assets/destruir-bloque.mp3");
  muerteSer = loadSound("assets/meteorito-muerte.mp3");

  fuenteBoton = loadFont("assets/Montserrat-Medium.ttf");
  fuenteCuadro = loadFont("assets/Montserrat-Regular.ttf");
}

function setup() 
{
  createCanvas(1280, 720);
  noCursor();

  juego = new Juego();
}

//Máquina de estados
let estado = ESTADO_MENU;

function draw() 
{
  switch(estado) 
  {
    case ESTADO_MENU:
      image(fondo, 0, 0, width, height);

      push();
      fill(255);
      textFont(fuenteBoton);
      textAlign(CENTER, CENTER);
      textSize(36);
      text("EQUILIBRIO", 640, 190);
      pop();

      dibujarBoton("MÚSICA", 640, 261, 320, 48);
      dibujarBoton("INSTRUCCIONES", 640, 327, 320, 48, 1);
      dibujarBoton("CRÉDITOS", 640, 393, 320, 48, 2);
      dibujarBoton("JUGAR", 640, 459, 320, 48, 3);
    break;

    case ESTADO_INSTRUCCIONES:
      image(fondo, 0, 0, width, height);
      dibujarBoton("INICIO", 640, 645, 320, 48, 0);
      dibujarCuadro("Usá las flechas del teclado para mover al Astronauta sobre la plataforma, y el mouse para mover la mira y disparar. Si bien no podes saltar, si podes salir por un extremo (arriba, abajo, izquierda o derecha) y aparecer en el opuesto.\nEvitá pisar los bloques rojos dado que te atrapan y se cambia a Rover: el nivel de O2/W baja más rápido y quedas atrapado unos segundos hasta liberarte solo.\nLos bloques grises restan O2 al pisarlos y mientras te quedes quieto en ellos.\nSi un meteorito te golpea, pierdes la partida.\nSi un meteorito golpea algún bloque este se bloquea y no podrás pisarlo; si se bloquea demasiada plataforma, también pierdes.\nSi pisas un bloque verde tu nivel de O2 se estabiliza, pero si permanecés demasiado tiempo quieto en el mismo se agota, pasa a gris y reaparece en otro punto de la plataforma.\nMantené presionado el click izquierdo para disparar contra los meteoritos y destruirlos antes de que impacten.\nCada partida dura 60 segundos y para ganar debés sobrevivir con el nivel de O2 mayor a cero.",
      640, 300, 920, 560);
    break;

    case ESTADO_CREDITOS:
      image(fondo, 0, 0, width, height);
      dibujarBoton("INICIO", 640, 669, 320, 48, 0);
      dibujarCuadro("Autoría: Daniel Toledo.\nTodos los archivos multimedia fueron generados con IA.\nEste juego busca representar la capacidad tecnológica humana actual para poder explorar el universo cómo así también su limitación física al encontrarse con el mismo.\nLos bloques verdes representan a la Tierra, los grises claros a la Luna y los rojos a Marte.\nLas misiones espaciales lunares realizadas inicialmente por animales y luego por humanos hasta la actualidad representan un peligro real no solo por la falta de oxígeno si no también por el deterioro físico que implica para la humanidad abandonar la Tierra debido a la falta de gravedad, los rayos cósmicos y la lluvia de meteoritos en la cara oculta de la luna.\nMarte es el planeta más cercano a la Tierra pero su atmósfera y geografía suponen un reto dado que solamente a través de un robot de exploración marciana (Rover) es que se pudo realizar un reconocimiento pero aún así la última vez no sobrevivió y la humanidad no podría regresar debido a la falta de combustible, imposible de llevar ni de generar localmente.\nEl Telescopio busca representar una máquina del tiempo al poder conocer el pasado del universo dado que la luz tarda demasiado en llegar y de los sistemas de defensa para destrucción de meteoritos.\nLos satélites orbitan la Tierra y ninguna sondas espacial ha podido superar la vía lactea.",
      640, 327, 1000, 600);
    break;

    case ESTADO_JUEGO:
      image(fondo, 0, 0, width, height);

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

        if (segundosRestantes <= 0) 
        {
          juego.resultado = "VICTORIA";
          juego.frameDeFin = frameCount;
        } 
        else if (juego.nivelO2W <= 0) 
        {
          juego.resultado = "DERROTA";
          juego.detalleResultado = "Te quedaste sin oxígeno.";
          juego.frameDeFin = frameCount;
        }
        else if (juego.cantidadBloqueadas >= juego.totalCeldasActivas * juego.porcentajeColapso) 
        {
          juego.resultado = "DERROTA";
          juego.detalleResultado = "La plataforma colapsó.";
          juego.frameDeFin = frameCount;
        }
      }

      juego.dibujarPlataforma();
      juego.dibujarMeteoritos();
      juego.astronauta.dibujar();

      //HUD del tiempo restante, el nivel y la integridad de la plataforma (borde derecho)
      push();
      noStroke();
      fill(255);
      textFont(fuenteCuadro);
      textAlign(RIGHT, TOP);
      textSize(20);
      text("Tiempo: " + segundosRestantes, 1225, 85);
      text("O2/W: " + juego.nivelO2W, 1225, 115);
      let porcentajeIntacta = 100 - floor((juego.cantidadBloqueadas / juego.totalCeldasActivas) * 100);
      text("Plataforma: " + porcentajeIntacta + "%", 1225, 145);
      pop();

      if (juego.resultado != "") 
      {
        let segundosJugados = floor(framesTranscurridos / 60);
        if (segundosJugados > 60) 
        {
          segundosJugados = 60;
        }

        dibujarCuadro(juego.resultado + "\n" + juego.detalleResultado + "\nSobreviviste " + segundosJugados + " segundos.", 640, 327, 500, 230);
        dibujarBoton("INICIO", 640, 469, 320, 48, 0);
      }
    break;
  }

  dibujaPuntero();
}

//se llama una única vez por click (sirve para los botones del menu)
function mousePressed()
{
  switch(estado) 
  {
    case ESTADO_MENU:
      if(mouseOverRect(640, 261, 320, 48))
      {
        if(musica.isPlaying())
        {
          musica.pause();
        }
        else
        {
          musica.loop();
        }
      }
      chequearClick(640, 327, 320, 48, ESTADO_INSTRUCCIONES);
      chequearClick(640, 393, 320, 48, ESTADO_CREDITOS);

      if(mouseOverRect(640, 459, 320, 48))
      {
        //frameCount para la partida arranca aca, no antes
        juego.frameDeInicio = frameCount;
        juego.reiniciar();
        estado = ESTADO_JUEGO;
      }
    break;

    case ESTADO_INSTRUCCIONES:
      chequearClick(640, 645, 320, 48, ESTADO_MENU);
    break;

    case ESTADO_CREDITOS:
      chequearClick(640, 669, 320, 48, ESTADO_MENU);
    break;

    case ESTADO_JUEGO:
      if (juego.resultado != "") 
      {
        chequearClick(640, 469, 320, 48, ESTADO_MENU);
      }
    break;
  }
}

//POO con IA

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

    //frame en el que arranca la partida (se actualiza al presionar JUGAR)
    this.frameDeInicio = 0;
    //frame en el que termina la partida (se fija una única vez al haber resultado)
    this.frameDeFin = 0;

    //nivel de O2/W, por posición del astronauta (no por tiempo puro)
    this.nivelO2W = 90;
    this.cantidadDescuentoNivelGris = 3;
    this.cantidadDescuentoNivelRojo = 9;
    //cuanto tiempo queda atrapado el Rover en un bloque rojo antes de liberarse solo
    this.duracionAtrapadoFrames = 360;

    /*un bloque verde (Tierra) no estabiliza para siempre: si el usuario permanece quieto 
    demasiado tiempo, se agota y pasa a gris claro (Luna), como cualquier otro. Asi no 
    alcanza con plantarse en un solo bloque verde*/
    this.duracionVerdeFrames = 240;

    //resultado de la partida ("" mientras se juega, "VICTORIA" o "DERROTA" al terminar)
    this.resultado = "";
    this.detalleResultado = "";

    /*integridad de la plataforma: si se bloquea demasiado (no solo la celda propia), se 
    pierde la partida aunque el O2/W este bien. Asi no alcanza con defender un solo bloque*/
    this.totalCeldasActivas = this.contarCeldasActivas();
    this.cantidadBloqueadas = 0;
    this.porcentajeColapso = 0.3;

    /*meteoritos y personajes: el meteorito no es un extra, es la amenaza 
    (junto al astronauta/rover)*/
    this.meteoritos = [];
    //el ritmo de aparicion arranca mas tranquilo y se acelera hacia el final de la partida
    this.intervaloMeteoritoInicial = 46;
    this.intervaloMeteoritoFinal = 24;
    this.frameUltimoMeteorito = 0;

    /*disparo contra meteoritos (click izquierdo sostenido, con enfriamiento entre disparo y 
    disparo)*/
    this.proximoFrameDisparo = 0;
    this.cooldownDisparo = 15;
    this.radioDisparo = 26;

    this.astronauta = new Astronauta(floor(this.cantidadColumnas / 2), this);

    //extras: solo ambientacion de fondo, no interactuan con la partida
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

      this.filas.push(new Fila(i, cantidadActivaEnEstaFila, this.cantidadColumnas, this.tamañoBloque, this.centroXPlataforma, this.centroYPlataforma));
    }

    this.garantizarVerde();
  }

  /*método: si ningún bloque salió verde al azar, fuerza uno para que siempre haya 
  al menos uno*/
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
    this.generarFilas();
    this.nivelO2W = 90;
    this.resultado = "";
    this.detalleResultado = "";
    this.frameDeFin = 0;
    this.totalCeldasActivas = this.contarCeldasActivas();
    this.cantidadBloqueadas = 0;
    this.meteoritos = [];
    this.frameUltimoMeteorito = 0;
    this.proximoFrameDisparo = 0;
    this.astronauta = new Astronauta(floor(this.cantidadColumnas / 2), this);
  }

  //método: dibuja todas las filas de la plataforma
  dibujarPlataforma() 
  {
    for (let i = 0; i < this.filas.length; i = i + 1) 
    {
      this.filas[i].dibujar();
    }
  }

  //método: devuelve el numero de fila (superficie) mas alto activo para una columna dada
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

  /*metodo: devuelve el tipo de bloque de una celda puntual (fila y columna exactas), 
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
  la primera columna activa que NO este bloqueada. Así, si el extremo exacto quedo
  bloqueado por un meteorito, el toroide sigue funcionando con la celda libre mas cercana
  a ese extremo (en vez de romperse para siempre). Devuelve -1 si toda la fila esta bloqueada*/
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
  recorriendo las filas de una columna puntual. Devuelve -1 si toda la columna esta bloqueada*/
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
    let filasActivas = [];
    let columnasActivas = [];

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
    let filasCandidatas = [];
    let columnasCandidatas = [];

    for (let i = 0; i < this.filas.length; i = i + 1) 
    {
      for (let columna = 0; columna < this.cantidadColumnas; columna = columna + 1) 
      {
        let esLaMismaCelda = (this.filas[i].numeroDeFila == filaExcluida_ && columna == columnaExcluida_);

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
  a lo largo de los 60 segundos, así la partida se pone más dificil hacia el final*/
  actualizarMeteoritos(framesTranscurridos_) 
  {
    let progresoPartida = constrain(framesTranscurridos_ / (60 * 60), 0, 1);
    let intervaloActual = lerp(this.intervaloMeteoritoInicial, this.intervaloMeteoritoFinal, progresoPartida);

    if (framesTranscurridos_ - this.frameUltimoMeteorito >= intervaloActual) 
    {
      let nuevoMeteorito = new Meteorito();
      nuevoMeteorito.generar(this);
      this.meteoritos.push(nuevoMeteorito);
      this.frameUltimoMeteorito = framesTranscurridos_;
    }

    for (let i = 0; i < this.meteoritos.length; i = i + 1) 
    {
      this.meteoritos[i].actualizar(this);
    }
  }

  //método: dibuja todos los meteoritos (activos o en animación de explosión)
  dibujarMeteoritos() 
  {
    for (let i = 0; i < this.meteoritos.length; i = i + 1) 
    {
      this.meteoritos[i].dibujar();
    }
  }

  /*método: mientras se mantenga presionado el click izquierdo, 
  dispara contra el meteorito bajo la mira (con enfriamiento)*/
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

    /*bucle de construccion: recorre las columnas y arma esta fila, con tipo aleatorio en 
    cada activa se guardan columnaInicio/columnaFin como propiedades: son el rango activo 
    real de ESTA fila, usado despues para el toroide horizontal (cada fila de la pirámide 
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
    //bucle de recorrido: recorre las columnas ya construidas y dibuja cada bloque activo
    for (let columna = 0; columna < this.cantidadColumnas; columna = columna + 1) 
    {
      if (this.bloques[columna] != TIPO_VACIO) 
      {
        let posX = this.centroX - (this.cantidadColumnas * this.tamañoBloque) / 2 + (columna + 0.5) * this.tamañoBloque;
        let posY = this.centroY - this.tamañoBloque / 2 - (this.numeroDeFila - 1) * this.tamañoBloque;

        push();
        fill(colorDeTipo(this.bloques[columna]));
        stroke(0);
        strokeWeight(2);
        rectMode(CENTER);
        rect(posX, posY, this.tamañoBloque, this.tamañoBloque);
        pop();
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

  //método: actualiza movimiento, posicion en pantalla y nivel de O2/W
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

    /*toroide vertical: el techo de cada columna es distinto (la pirámide es mas angosta 
    arriba). Si el extremo esta bloqueado por un meteorito, se busca la primera celda 
    libre desde ese extremo (asi un bloqueo puntual no rompe el toroide para siempre)*/
    let filaTechoColumna = juego_.obtenerFilaSuperficie(this.columna);

    if (filaDeseada < 1) 
    {
      filaDeseada = juego_.buscarFilaLibreDesdeExtremo(this.columna, filaTechoColumna, true);
    }
    if (filaDeseada > filaTechoColumna) 
    {
      filaDeseada = juego_.buscarFilaLibreDesdeExtremo(this.columna, filaTechoColumna, false);
    }

    //toda la columna esta bloqueada: no hay donde reaparecer, no se mueve
    if (filaDeseada == -1) 
    {
      return;
    }

    /*toroide horizontal: cada fila tiene su propio ancho activo (la pirámide es mas angosta 
    arriba). Misma idea que el vertical: si el extremo esta bloqueado, se busca la primera 
    celda libre desde ese extremo*/
    let columnaInicioFila = juego_.obtenerColumnaInicioFila(filaDeseada);
    let columnaFinFila = juego_.obtenerColumnaFinFila(filaDeseada);

    if (columnaDeseada < columnaInicioFila) 
    {
      columnaDeseada = juego_.buscarColumnaLibreDesdeExtremo(filaDeseada, columnaInicioFila, columnaFinFila, true);
    }
    if (columnaDeseada >= columnaFinFila) 
    {
      columnaDeseada = juego_.buscarColumnaLibreDesdeExtremo(filaDeseada, columnaInicioFila, columnaFinFila, false);
    }

    //toda la fila esta bloqueada: no hay donde reaparecer, no se mueve
    if (columnaDeseada == -1) 
    {
      return;
    }

    let tipoDestino = juego_.obtenerTipoDeCelda(filaDeseada, columnaDeseada);

    //no se puede pisar un bloque bloqueado ni un hueco vacío
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
    this.x = juego_.centroXPlataforma - (juego_.cantidadColumnas * juego_.tamañoBloque) / 2 + (this.columna + 0.5) * juego_.tamañoBloque;
    this.y = juego_.centroYPlataforma - this.fila * juego_.tamañoBloque;
  }

  //método: aplica el descuento de O2/W segun el bloque pisado y cuanto tiempo lleva ahí
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
      }

      this.framesQuieto = 0;
      this.columnaAnterior = this.columna;
      this.filaAnterior = this.fila;
    } 
    else 
    {
      //se mantiene en la misma posición: se acumula el descuento cada segundo
      this.framesQuieto = this.framesQuieto + 1;

      //un verde pisado demasiado tiempo se agota (pasa a gris claro) y deja de estabilizar
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

      //el Rover queda atrapado un tiempo limitado; después se libera y puede volver a moverse
      if (this.atrapado == true && this.framesQuieto >= juego_.duracionAtrapadoFrames) 
      {
        this.atrapado = false;
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

  //método: dibuja astronauta o rover segun este atrapado o no
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
      rect(0, 8, 46, 22, 2);
      fill(60);
      circle(-18, 21, 12);
      circle(0, 21, 12);
      circle(18, 21, 12);
      fill(200);
      rect(0, -15, 15, 15, 2);
    } 
    else 
    {
      //Astronauta
      fill(255);
      rectMode(CENTER);
      rect(0, 16, 22, 34, 3);
      circle(0, -12, 30);
      fill(0);
      circle(0, -12, 15);
    }

    pop();
  }
}

//cae con rastro, no rebota, explota e impacta (o es interceptado) con sonido paneado
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
    this.radio = 14;

    /*rastro: dos arrays paralelos con las posiciones anteriores (en vez de un array de 
    objetos)*/
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

    this.x = juego_.centroXPlataforma - (juego_.cantidadColumnas * juego_.tamañoBloque) / 2 + (this.columnaObjetivo + 0.5) * juego_.tamañoBloque;
    this.y = -20;
    this.yObjetivo = juego_.centroYPlataforma - this.filaObjetivo * juego_.tamañoBloque;

    this.rastroX = [];
    this.rastroY = [];
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
      this.rastroX.splice(0, 1);
      this.rastroY.splice(0, 1);
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

    let panorama = map(this.x, 0, 1280, -1, 1);

    if (this.columnaObjetivo == juego_.astronauta.columna && this.filaObjetivo == juego_.astronauta.fila) 
    {
      muerteSer.pan(panorama);
      muerteSer.play();
      juego_.resultado = "DERROTA";
      juego_.detalleResultado = "Un meteorito te impactó directamente.";
      juego_.frameDeFin = frameCount;
    } 
    else 
    {
      meteorito.pan(panorama);
      meteorito.play();
      juego_.marcarBloqueado(this.filaObjetivo, this.columnaObjetivo);
    }
  }

  //método: el meteorito es destruido en el aire por un disparo, antes de impactar
  interceptar() 
  {
    this.activo = false;
    this.explotando = true;
    this.frameDeExplosion = frameCount;

    let panorama = map(this.x, 0, 1280, -1, 1);
    interceptar.pan(panorama);
    interceptar.play();
  }

  //método: dibuja el rastro, el meteorito activo, y la explosión si corresponde
  dibujar() 
  {
    if (this.activo == true) 
    {
      push();
      noStroke();

      for (let i = 0; i < this.rastroX.length; i = i + 1) 
      {
        let alfa = map(i, 0, this.rastroX.length, 20, 140);
        fill(255, 170, 60, alfa);
        circle(this.rastroX[i], this.rastroY[i], this.radio * 0.6);
      }

      fill(255, 170, 60);
      circle(this.x, this.y, this.radio);
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

  //método: dibuja el satélite según los frames transcurridos desde que arrancó la partida
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
    //cuerpo central, perpendicular a los paneles y mas corto que la suma de ambos
    rect(0, 0, 10, 16);
    pop();
  }
}

class Sonda //cruza una sola vez, aproximadamente a mitad de partida
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

//devuelve el color de relleno según el tipo de bloque
function colorDeTipo(tipo_) 
{
  if (tipo_ == TIPO_ROJO) 
  {
    return color(200, 70, 50);
  }
  if (tipo_ == TIPO_VERDE) 
  {
    return color(70, 180, 100);
  }
  if (tipo_ == TIPO_GRIS_CLARO) 
  {
    return color(210, 210, 218);
  }
  if (tipo_ == TIPO_GRIS_OSCURO) 
  {
    return color(55, 50, 48);
  }

  return color(0, 0, 0, 0);
}

//dibuja un botón rectangular centrado en x_, y_
function dibujarBoton(txt_, x_, y_, ancho_, alto_) 
{
  push();
  translate(x_, y_);

  if(mouseOverRect(x_, y_, ancho_, alto_)) 
  {
    scale(1.03);
  }

  fill(0);
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  rectMode(CENTER);
  rect(0, 0, ancho_, alto_, 6);
  textFont(fuenteBoton);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(16);
  text(txt_, 0, 1);
  pop();
}

//devuelve true si coincide la coordenada del mouse con zona rect
function mouseOverRect(x_centro_, y_centro_, ancho_, alto_) 
{
  return (mouseX > x_centro_-ancho_/2 && mouseX < x_centro_+ancho_/2 &&
  mouseY > y_centro_-alto_/2 && mouseY < y_centro_+alto_/2);
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
  stroke(0, 220, 255, 220);
  strokeWeight(2);
  ellipse(mouseX, mouseY, 30, 30);

  noStroke();
  fill(0, 220, 255, 230);
  ellipse(mouseX, mouseY, 10, 10);
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