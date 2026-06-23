console.log('Pong Intervenido');

// Setup de ambiente
const lienzo = document.getElementById('lienzo');
const ctx = lienzo.getContext('2d');

// Dimensiones del lienzo
const { width, height } = lienzo; // Ancho y altura del lienzo

// GameArea
const HUDheight = 50;
const gameMargin = 10;
const gameArea = {
    x1: gameMargin, y1: HUDheight,
    x2: width - gameMargin, y2: height - gameMargin,
};


// Paleta de colores (PICO-8)
const paleta = [
	'#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F',
	'#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436',
	'#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
];

// Vars globales del juego
let puntosIzquierda = 0;
let puntosDerecha = 0;
let finjuego = false;
let estadoJuego = "inicio";
let proximoDesdeArriba = true;

const PUNTOS_PARA_GANAR = 10;


function cls ()
{
	ctx.clearRect(0, 0, width, height);
}

function rectFill (x1, y1, x2, y2, c)
{
	ctx.fillStyle = paleta[c];
	ctx.fillRect(
		x1, y1,									// Punto inicial
		Math.max(x1, x2) - Math.min(x1, x2),	// Ancho
		Math.max(y1, y2) - Math.min(y1, y2)		// Alto
	);
}

function circFill (x, y, r, c)
{
	ctx.beginPath();
	ctx.fillStyle = paleta[c];
	ctx.arc(x, y, r, 0, Math.PI*2);
	ctx.fill();
	ctx.closePath();
}

function textFill (txt, x, y, c, style = 'bold 30px sans', align = 'left', baseline = 'top')
{
	ctx.font = style;
	ctx.textAlign = align;
	ctx.textBaseline = baseline;
	ctx.fillStyle = paleta[c];

	ctx.fillText(txt, x, y)
}

function textWidth (txt)
{
	ctx.font = 'bold 30px sans';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';

	return ctx.measureText(txt).width;
}

function colision (a, b)
{
    return !(
        a.x + a.hitbox.x1 > b.x + b.hitbox.x2
        || a.x + a.hitbox.x2 < b.x + b.hitbox.x1
        || a.y + a.hitbox.y1 > b.y + b.hitbox.y2
        || a.y + a.hitbox.y2 < b.y + b.hitbox.y1
    );
}

let ent_paleta = [];

function showPaleta (mostrar = true)
{
    if (mostrar)
    {
        for (let i = 0, l = 16; i < l; i++)
        {
            const e = new ColorPaleta();
            e.width = 50;
            e.height = 50;
            e.color = i;

            e.x = (i % 4) * 50;
            e.y = Math.floor(i / 4) * 50;

            ent_paleta.push(e);
        }
    }
    else
    {
        for (const e of ent_paleta)
        {
            e.remove();
        }

        ent_paleta = [];
    }
}

function contarPersonajes()
{
    let total = 0;

    for (const e of Entidad.entidades)
    {
        if (e instanceof Personaje)
        {
            total++;
        }
    }

    return total;
}

function crearPersonaje()
{
    const desdeArriba = proximoDesdeArriba;
    proximoDesdeArriba = !proximoDesdeArriba;

    const x = gameArea.x1 + Math.random() * (gameArea.x2 - gameArea.x1 - 30);
    const y = desdeArriba ? gameArea.y1 - 30 : gameArea.y2 - 1;
    const dy = desdeArriba ? 1 : -1;

    const Tipo = CONFIG_PERSONAJES.tipos[
        Math.floor(Math.random() * CONFIG_PERSONAJES.tipos.length)
    ];

    new Tipo(x, y, dy);
}


class Control
{
    // Singleton
    static instance = null;

    // Teclas
    static flechaDerecha = false;
    static flechaIzquierda = false;
    static flechaArriba = false;
    static flechaAbajo = false;
    static w = false;
    static s = false;
    static enter = false;

    constructor ()
    {
        window.addEventListener('keydown',  Control.manageControl);
        window.addEventListener('keyup',    Control.manageControl);
    }

    static getInstance ()
    {
        if (Control.instance === null)
        {
            Control.instance = new Control();
        }

        return Control.instance;
    }

    static manageControl (evt)
    {
        switch (evt.code)
        {
            case 'ArrowRight':
                Control.flechaDerecha = evt.type === 'keydown';
                break;

            case 'ArrowLeft':
                Control.flechaIzquierda = evt.type === 'keydown';
                break;

            case 'ArrowUp':
                Control.flechaArriba = evt.type === 'keydown';
                break;

            case 'ArrowDown':
                Control.flechaAbajo = evt.type === 'keydown';
                break;

            case 'KeyW':
                Control.w = evt.type === 'keydown';
                break;

            case 'KeyS':
                Control.s = evt.type === 'keydown';
                break;

            case 'Enter':
                Control.enter = evt.type === 'keydown';
                break;

            default:
                break;
        }
    }
}

class Entidad
{
	static entidades = [];
    #width = 10;
    #height = 10;

	constructor ()
	{
		this.x = 0;
		this.y = 0;
		this.color = 0;

        this.velocidad = 0;
        this.dx = 0;
        this.dy = 0;

        this.hitbox = {
            x1: 0, y1: 0,
            x2: 0, y2: 0,
        };

		Entidad.entidades.push(this);
	}

    get width ()
    {
        return this.#width;
    }

    set width (val)
    {
        this.#width = val;
        this.hitbox.x2 = val;

        return val;
    }

    get height ()
    {
        return this.#height;
    }

    set height (val)
    {
        this.#height = val;
        this.hitbox.y2 = val;
        return val;
    }

	update ()
	{
        this.x += this.dx;
        this.y += this.dy;
	}

	draw ()
	{
		rectFill(
			this.x, 
			this.y, 
			this.x + this.width,
			this.y + this.height,
			this.color
		);

        if (this.debug)
        {
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(
                this.x + this.hitbox.x1, 
                this.y + this.hitbox.y1, 
                this.hitbox.x2 - this.hitbox.x1, 
                this.hitbox.y2 - this.hitbox.y1, 
            );
        }
	}

    remove ()
    {
        const ind = Entidad.entidades.indexOf(this);
        Entidad.entidades.splice(ind, 1);
    }
}

class ColorPaleta extends Entidad
{
    draw ()
    {
        super.draw();

        textFill(this.color, this.x + 10, this.y + 20, 
        this.color == 7 ? 0 : 7);
    }
}

class Jugador extends Entidad
{
    constructor (lado, teclaArriba, teclaAbajo, color = 9)
    {
        super();

        this.lado = lado;
        this.teclaArriba = teclaArriba;
        this.teclaAbajo = teclaAbajo;

        this.velocidadNormal = 5;
        this.velocidad = this.velocidadNormal;
        this.tiempoRalentizado = 0;

        this.alturaOriginal = 120;
        this.tiempoAchicado = 0;

        this.width = 20;
        this.height = 120;
        this.color = color;

        this.posicionInicial();
    }

    posicionInicial ()
    {
        if (this.lado === 'derecha')
        {
            this.x = gameArea.x2 - this.width;
        }
        else
        {
            this.x = gameArea.x1;
        }

        this.y = (gameArea.y2 - gameArea.y1) / 2 + gameArea.y1 - this.height / 2;
    }

    enlentecer(nuevaVelocidad = 2, duracion = 180)
    {
        this.velocidad = nuevaVelocidad;
        this.tiempoRalentizado = duracion;
    }

    achicar(nuevaAltura = 60, duracion = 180)
    {
        this.alturaOriginal ??= this.height;

        this.height = nuevaAltura;
        this.tiempoAchicado = duracion;
    }

    update ()
    {
        this.dx = 0;
        this.dy = 0;

        if (Control[this.teclaArriba]) this.dy = -this.velocidad;
        if (Control[this.teclaAbajo]) this.dy = this.velocidad;

        super.update();

        if (this.y <= gameArea.y1)
            this.y = gameArea.y1;

        if (this.y >= gameArea.y2 - this.height)
            this.y = gameArea.y2 - this.height;

        if (this.tiempoRalentizado > 0)
        {
            this.tiempoRalentizado--;

            if (this.tiempoRalentizado === 0)
            {
                this.velocidad = this.velocidadNormal;
            }
        }

        if (this.tiempoAchicado > 0)
        {
            this.tiempoAchicado--;

            if (this.tiempoAchicado === 0)
            {
                this.height = this.alturaOriginal;
            }
        }
    }
}

class Pelota extends Entidad
{
    #radio = 10;

    constructor ()
    {
        super();

        super.width = this.#radio * 2;
        super.height = this.#radio * 2;

        this.color = 1;

        this.velocidadInicial = 1;
        this.velocidad = this.velocidadInicial;

        this.posicionInicial();
    }

    get width ()
    {
        return super.width;
    }

    set width (val)
    {
        super.width = val;
        super.height = val;
        this.#radio = val / 2;

        return val;
    }

    get height ()
    {
        return super.height;
    }

    set height (val)
    {
        super.width = val;
        super.height = val;
        this.#radio = val / 2;

        return val;
    }

    get radio ()
    {
        return this.#radio;
    }

    set radio (val)
    {
        this.#radio = val;

        super.width = this.#radio * 2;
        super.height = this.#radio * 2;

        return val;
    }

    posicionInicial ()
    {
        this.x = (gameArea.x2 - gameArea.x1) / 2 + gameArea.x1 - this.#radio;
        this.y = (gameArea.y2 - gameArea.y1) / 2 + gameArea.y1 - this.#radio;
    }

    acelerar (cantidad = 0.5)
    {
        this.velocidad += cantidad;

        this.dx = this.dx > 0 ? this.velocidad : -this.velocidad;
        this.dy = this.dy > 0 ? this.velocidad : -this.velocidad;
    }

    resetMovimiento ()
    {
        this.velocidad = this.velocidadInicial;

        const dx = this.velocidad * (Math.random() < .5 ? -1 : 1);
        const dy = this.velocidad * (Math.random() < .5 ? -1 : 1);

        this.dx = 0;
        this.dy = 0;

        setTimeout(() => {
            this.dx = dx;
            this.dy = dy;
        }, 2000);
    }

    update ()
{
    if (estadoJuego !== "jugando")
    {
        this.dx = 0;
        this.dy = 0;
        return;
    }

    super.update();

   

    // Rebote arriba y abajo
    if (this.y <= gameArea.y1 || this.y >= gameArea.y2 - this.height)
    {
        this.dy *= -1;
    }

    // Gol para la derecha
    if (this.x <= gameArea.x1)
    {
        puntosDerecha++;

        if (puntosDerecha >= PUNTOS_PARA_GANAR)
        {
            estadoJuego = "fin";
            finjuego = true;
        }

        this.posicionInicial();
        this.resetMovimiento();
        return;
    }

// Gol para la izquierda
if (this.x >= gameArea.x2 - this.width)
{
    puntosIzquierda++;

    if (puntosIzquierda >= PUNTOS_PARA_GANAR)
    {
        estadoJuego = "fin";
        finjuego = true;
    }

    this.posicionInicial();
    this.resetMovimiento();
    return;
}

    for (const e of Entidad.entidades)
    {
        if (e === this) continue;

        if (colision(this, e))
        {
            let pdy = this.dy;
            this.y -= pdy;

            if (!colision(this, e)) this.dy *= -1;

            this.y += pdy;

            let pdx = this.dx;
            this.x -= pdx;

            if (!colision(this, e)) this.dx *= -1;

            this.x += pdx;

            if (e.onColision !== undefined)
            {
                e.onColision(this);
            }
        }
    }
}

    draw ()
    {
        circFill(
            this.x + this.#radio,
            this.y + this.#radio,
            this.#radio,
            this.color
        );


        if (this.debug)
        {
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(
                this.x + this.hitbox.x1, 
                this.y + this.hitbox.y1, 
                this.hitbox.x2 - this.hitbox.x1, 
                this.hitbox.y2 - this.hitbox.y1, 
            );
        }
    }
}

class Personaje extends Entidad
{
    constructor()
    {
        super();

        this.estado = "normal";
        this.rebotesVerticales = 0;
        this.maxRebotesVerticales = 1;

         this.cambioX = 0.03;
    }

    mover()
    {
        this.x += this.dx;
        this.y += this.dy;
    }

    reboteLateral()
    {
        if (this.x <= gameArea.x1 || this.x >= gameArea.x2 - this.width)
        {
            this.dx *= -1;
        }
    }

    rebotarConJugadores()
    {
        for (const e of Entidad.entidades)
        {
            if (e instanceof Jugador && colision(this, e))
            {
                this.dx *= -1;
            }
        }
    }

    cambiarEstado(nuevoEstado)
    {
        if (this.estado === nuevoEstado) return;

        this.estado = nuevoEstado;

        if (this.estado === "enojado")
        {
            this.dx *= 2;
            this.dy *= 2;
        }
    }

    reboteVertical()
    {
        if (this.dy > 0 && this.y >= gameArea.y2 - this.height)
        {
            this.y = gameArea.y2 - this.height;
            this.dy *= -1;
            this.rebotesVerticales++;
        }

        if (this.dy < 0 && this.y <= gameArea.y1)
        {
            this.y = gameArea.y1;
            this.dy *= -1;
            this.rebotesVerticales++;
        }

        if (this.rebotesVerticales > this.maxRebotesVerticales)
        {
            this.remove();
        }
    }
}

class Venenoso extends Personaje
{
    constructor(x, y, dy)
    {
        super();

        this.x = x;
        this.y = y;

        this.width = 30;
        this.height = 30;
        this.color = 11; // verde

        this.dy = dy;
        this.dx = Math.random() * 2 - 1;
    }

    update()
    {
        this.y += this.dy;
        this.x += this.dx;

        this.dx += Math.random() * this.cambioX - this.cambioX / 2;

        if (this.dx > 2) this.dx = 2;
        if (this.dx < -2) this.dx = -2;

        if (this.x <= gameArea.x1 || this.x >= gameArea.x2 - this.width)
        {
            this.dx *= -1;
        }

        this.tocarJugadores();

        if (this.dy > 0 && this.y >= gameArea.y2 - this.height)
        {
            this.y = gameArea.y2 - this.height;
            this.dy *= -1;
            this.rebotesVerticales++;
        }

        if (this.dy < 0 && this.y <= gameArea.y1)
        {
            this.y = gameArea.y1;
            this.dy *= -1;
            this.rebotesVerticales++;
        }

        if (this.rebotesVerticales > this.maxRebotesVerticales)
        {
            this.remove();
        }
    }

    tocarJugadores()
    {
        for (const e of Entidad.entidades)
        {
            if (e instanceof Jugador && colision(this, e))
            {

                e.enlentecer(2, 180);
                
                this.remove();
                return;
            }
        }
    }

    onColision(pelota)
    {
        if (!(pelota instanceof Pelota)) return;

        this.cambiarEstado("enojado");

        this.dy *= -1;
        this.dx *= -1;
    }
}

class Acelerador extends Personaje
{
    
    constructor(x, y, dy)
    {
        super();

        this.x = x;
        this.y = y;

        this.width = 30;
        this.height = 30;

        this.color = 8;

        this.dy = dy;

        this.dx = Math.random() * 2 - 1;
        this.recuperando = false;
    }

    update()
    {
        this.y += this.dy;
        this.x += this.dx;

        this.rebotarConJugadores();

        // cambia un poquito la dirección horizontal
        this.dx += Math.random() * this.cambioX - this.cambioX / 2;

        // limita para que no se vaya demasiado rápido de costado
        if (this.dx > 2) this.dx = 2;
        if (this.dx < -2) this.dx = -2;

        // rebota contra los laterales
        if (this.x <= gameArea.x1 || this.x >= gameArea.x2 - this.width)
        {
            this.dx *= -1;
        }

        // se muere si se sale por arriba o abajo
        if (this.dy > 0 && this.y >= gameArea.y2 - this.height)
        {
            this.y = gameArea.y2 - this.height;
            this.rebotesVerticales++;

            if (this.rebotesVerticales > this.maxRebotesVerticales)
            {
                this.remove();
                return;
            }

            this.dy *= -1;
        }

        if (this.dy < 0 && this.y <= gameArea.y1)
        {
            this.y = gameArea.y1;
            this.rebotesVerticales++;

            if (this.rebotesVerticales > this.maxRebotesVerticales)
            {
                this.remove();
                return;
            }

            this.dy *= -1;
        }
    }

    onColision(pelota)
    {
        if (!(pelota instanceof Pelota)) return;

        if (this.recuperando) return;

        console.log("aceleró");

        pelota.acelerar(0.5);

        this.cambiarEstado("enojado");
        this.dy *= -1;
        this.recuperando = true;
    }
}

class Achicador extends Personaje
{
    constructor(x, y, dy)
    {
        super();

        this.x = x;
        this.y = y;

        this.width = 30;
        this.height = 30;

        this.color = 14;

        this.dy = dy;
        this.dx = Math.random() * 2 - 1;

    }

   tocarJugadores()
    {
        for (const e of Entidad.entidades)
        {
            if (e instanceof Jugador && colision(this, e))
            {
                console.log("Achicador tocó jugador");

                e.achicar(40, 600);

                this.remove();
                return;
            }
        }
    }

    onColision(pelota)
    {
        if (!(pelota instanceof Pelota)) return;

        console.log("Achicador enojado");

        this.cambiarEstado("enojado");
    }

    update()
    {
        this.mover();

        this.tocarJugadores();

        this.reboteLateral();
        this.reboteVertical();
    }


}

const CONFIG_PERSONAJES = {
    max: 4,
    respawn: 60,
    tiempoSpawn: 0,
    tipos: [Acelerador, Venenoso, Achicador]
};


function hud ()
{
    ctx.strokeStyle = paleta[13];
    ctx.strokeRect(
        gameArea.x1, gameArea.y1,
        gameArea.x2 - gameArea.x1,
        gameArea.y2 - gameArea.y1
    );

    // goles
    textFill(
        `${puntosIzquierda} - ${puntosDerecha}`,
        width / 2,
        20,
        12,
        'bold 30px sans',
        'center',
        'middle'
    );

    if (estadoJuego === "inicio")
    {
        ctx.fillStyle = '#0009';
        ctx.fillRect(0, 0, width, height);

        textFill(
            "PONG INTERVENIDO",
            width / 2,
            height / 2 - 70,
            12,
            'bold 48px sans',
            'center',
            'middle'
        );

        textFill(
            "Jugador izquierdo: W / S",
            width / 2,
            height / 2,
            7,
            'bold 22px sans',
            'center',
            'middle'
        );

        textFill(
            "Jugador derecho: ↑ / ↓",
            width / 2,
            height / 2 + 35,
            7,
            'bold 22px sans',
            'center',
            'middle'
        );

        textFill(
            "Presioná ENTER para empezar",
            width / 2,
            height / 2 + 90,
            10,
            'bold 26px sans',
            'center',
            'middle'
        );
    }

    if (finjuego)
    {
        ctx.fillStyle = '#0004'; // Negro con transparencia
        ctx.fillRect(
            0, 0,
            width, height
        );

        const cartelAncho = 560;
        const cartelAlto = 110;
        const cartelX = width / 2 - cartelAncho / 2;
        const cartelY = height / 2 - cartelAlto / 2;

        ctx.fillStyle = paleta[8];
        ctx.fillRect(
            cartelX,
            cartelY,
            cartelAncho,
            cartelAlto
        );

        textFill(
            puntosIzquierda > puntosDerecha
                ? "GANA IZQUIERDA"
                 : "GANA DERECHA",
                width / 2,
                height / 2,
                7,
                'bold 40px sans',
                'center',
                'middle'
        );

        textFill(
                "ENTER PARA REINICIAR",
                width / 2,
                height / 2 + 35,
                7,
                'bold 22px sans',
                'center',
                'middle'
        );
    }
}

function reiniciarJuego()
{
    Entidad.entidades = [];

    puntosIzquierda = 0;
    puntosDerecha = 0;
    finjuego = false;
    estadoJuego = "jugando";

    CONFIG_PERSONAJES.tiempoSpawn = 0;
    proximoDesdeArriba = true;

    new Jugador('derecha', 'flechaArriba', 'flechaAbajo', 9);
    new Jugador('izquierda', 'w', 's', 12);

    const p = new Pelota();
    crearPersonaje();
    p.resetMovimiento();
}

function init ()
{
    Control.getInstance();

    let jugador1 = new Jugador('derecha', 'flechaArriba', 'flechaAbajo', 9);
    jugador1.velocidad = 5;

    let jugador2 = new Jugador('izquierda', 'w', 's', 12);
    jugador2.velocidad = 5;

    const p = new Pelota();

    crearPersonaje();
  
    
    p.resetMovimiento();


	gameloop();
}

function update ()
{
    if (estadoJuego === "inicio")
    {
        if (Control.enter)
        {
            estadoJuego = "jugando";
        }

        return;
    }

    if (estadoJuego === "fin")
    {
        if (Control.enter)
        {
            reiniciarJuego();
        }

        return;
    }

    if (contarPersonajes() < CONFIG_PERSONAJES.max && CONFIG_PERSONAJES.tiempoSpawn <= 0)
    {
        crearPersonaje();
        CONFIG_PERSONAJES.tiempoSpawn = CONFIG_PERSONAJES.respawn;
    }

    CONFIG_PERSONAJES.tiempoSpawn--;

    for (const e of Entidad.entidades)
    {
        e.update();
    }
}

    function draw ()
{
    cls();
    
	for (const e of Entidad.entidades)
	{
		e.draw();
	}

    // HUD
    hud();
}

function gameloop ()
{
	update();
	draw();

    // console.log(Control.flechaDerecha, Control.flechaIzquierda, Control.enter);

	requestAnimationFrame(gameloop);
}

init();
