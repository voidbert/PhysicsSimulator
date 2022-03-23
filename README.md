# Physics Simulator

A **very simple** TypeScript 2D physics engine and some simulations to test it. This was made as
a High School Physics project. Therefore, it is written in Portuguese and there are no
plans to translate it.

**DO NOT** use this as a library for other projects, as this lacks completion and it was not
developed with integration in things like games in mind.

As of now, the available simulations are:

 - Projectile launch simulation
 - Air resistance simulations

In the future, the following will be available:

 - Solar System simulation
 - Coefficient of restitution simulation
 - Elastic collisions that calculate π

## Building

 - `npm run build`;

 - Start a web server in the root directory (`python -m http.server` or `php -S localhost:80`);

- Opening `index.html` won't work, since browsers won't start Web Workers when using `file:///`.