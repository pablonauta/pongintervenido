# Pong Intervenido

**Jugar online:**
https://pablonauta.github.io/pongintervenido/

**Jugar online:**
https://pong.tecnografic.com.uy/

## Descripción

Pong Intervenido es una versión modificada del clásico Pong para dos jugadores.

Además de la pelota y las paletas tradicionales, aparecen personajes especiales que alteran el desarrollo de la partida:

* Aceleradores que aumentan la velocidad de la pelota.
* Venenosos que enlentecen a las paletas de los jugadores.
* Achicadores que reducen el tamaño de las paletas.
* Sistema de puntaje.
* Fin de partida y reinicio del juego.

## Controles

### Jugador izquierdo

* W: mover arriba
* S: mover abajo

### Jugador derecho

* Flecha arriba: mover arriba
* Flecha abajo: mover abajo

### General

* ENTER: reiniciar partida

## Aspectos técnicos

El proyecto fue desarrollado utilizando programación orientada a objetos en JavaScript y renderizado mediante Canvas 2D.

La arquitectura del juego se basa en una jerarquía de entidades, donde los personajes especiales comparten comportamiento común a través de herencia y extienden sus funcionalidades mediante clases específicas.

### Estructura principal

```text
Entidad
├── Jugador
├── Pelota
└── Personaje
    ├── Acelerador
    ├── Venenoso
    └── Achicador
```

### Conceptos utilizados

* Herencia
* Encapsulamiento
* Polimorfismo básico
* Manejo de estados
* Detección de colisiones
* Generación dinámica de entidades
* Control de eventos mediante teclado
* Programación orientada a objetos

## Tecnologías utilizadas

* HTML5
* CSS3
* JavaScript
* Canvas 2D

## Autor

Pablo De Leon

Taller de Videojuegos - UTEC
