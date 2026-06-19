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
    }
}

class Ladrillo extends Entidad
{
    #puntos = 10;

    constructor (w = 100, h = 30, vida = 1)
    {
        super();

        this.width = w;
        this.height = h;

        this.vida = vida;
        this.color = [
            0, 12, 11, 10, 8
        ][ vida ];
    }

    get puntos ()
    {
        return this.#puntos;
    }

    set puntos (val)
    {
        this.#puntos = val;
        return val;
    }

    onColision (ent)
    {
        this.vida -= 1;

        if (this.vida <= 0)
        {
            puntos += this.#puntos;

            this.remove();
        }

        this.color = [
            0, 12, 11, 10, 8
        ][ this.vida ];
    }
}

class Pelota extends Entidad
{
    #radio = 10;
    //#jugador = null;

    constructor ()
    {
        super();

        super.width = this.#radio * 2;
        super.height = this.#radio * 2;

        this.color = 1;

        this.posicionInicial();
    }

    // get jugador ()
    // {
    //     return this.#jugador;
    // }

    // set jugador (val)
    // {
    //     this.#jugador = val;

    //     return val;
    // }

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

    resetMovimiento ()
    {
        const dx = 4 * (Math.random() < .5 ? -1 : 1);
        const dy = -4;

        this.dx = 0;
        this.dy = 0;

        const fn = _ => {
            this.dx = dx;
            this.dy = dy;
        };

        setTimeout(fn, 2000);
    }

    update ()
{
    if (finjuego)
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

    if (puntosDerecha >= 10)
    {
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

    if (puntosIzquierda >= 10)
    {
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

function hud ()
{
    ctx.strokeStyle = paleta[13];
    ctx.strokeRect(
        gameArea.x1, gameArea.y1,
        gameArea.x2 - gameArea.x1,
        gameArea.y2 - gameArea.y1
    );

    // for (let i = 0; i < 4; i++)
    // {
    //     textFill("Breakout", 
    //         10 + 2 * i, 
    //         18 - 2 * i, 
    //         11 - i);
    // }

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




    // Puntos
    // textFill(
    //     "PUNTOS", 
    //     (gameArea.x2 - gameArea.x1) / 2 + gameArea.x1,
    //     gameArea.y1 - 2,
    //     5,
    //     'bold 11px sans',
    //     'center',
    //     'bottom');

    // textFill(
    //     puntos,
    //     (gameArea.x2 - gameArea.x1) / 2 + gameArea.x1,
    //     gameArea.y1 - 14,
    //     12,
    //     'bold 25px sans',
    //     'center',
    //     'bottom'
    // );

    // Vidas
    // let strvidas = '';

    // for (let i = 0; i < vidas; i++)
    // {
    //     strvidas +=  '❤️';
    // }

    // textFill(
    //     strvidas,
    //     gameArea.x2,
    //     gameArea.y1 - 5,
    //     0,
    //     'bold 28px sans',
    //     'end',
    //     'bottom'
    // );

    if (finjuego)
    {
        ctx.fillStyle = '#0004'; // Negro con transparencia
        ctx.fillRect(
            0, 0,
            width, height
        );

        ctx.fillStyle = paleta[8];
        ctx.fillRect(
            0, height / 2 - 40,
            width, 80
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
    }
}

function init ()
{
    Control.getInstance();

    let jugador1 = new Jugador('derecha', 'flechaArriba', 'flechaAbajo', 9);
    jugador1.velocidad = 5;

    let jugador2 = new Jugador('izquierda', 'w', 's', 12);
    jugador2.velocidad = 5;

    const p = new Pelota();
    
    p.resetMovimiento();

    // p.dx = 4 * (Math.random() < .5 ? -1 : 1);
    // p.dy = -4;

    const cantCols = 7;
    const cantFilas = 4;
    const div = cantCols - 1;
    const gap = 10;
    const padding = 10;
    const lw = (gameArea.x2 - gameArea.x1 - gap * div - padding * 2) / cantCols;
    const lh = 20;

    // for (let j = 0; j < cantFilas; j++)
    // {
    //     const filay = gameArea.y1 + padding + (lh + gap) * j;

    //     for (let i = 0; i < cantCols; i++)
    //     {
    //         const e = new Ladrillo(lw, lh, cantFilas - j);
    //         e.x = (lw + gap) * i + padding + gameArea.x1;
    //         e.y = filay;
    //         e.puntos = e.vida * 10;
    //     }
    // }

    // Vars globales
    
    

	gameloop();
}

function update ()
{
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
