import {
    Circle,
    type ICoordinates,
    type Particle,
    type Range,
    Vector,
    clamp,
    getDistances,
    getEasing,
} from "@tsparticles/engine";
import type { AttractContainer } from "./Types.js";

const minFactor = 1,
    identity = 1,
    minRadius = 0;

/**
 *
 * @param container -
 * @param position -
 * @param attractRadius -
 * @param area -
 * @param queryCb -
 */
function processAttract(
    container: AttractContainer,
    position: ICoordinates,
    attractRadius: number,
    area: Range,
    queryCb: (p: Particle) => boolean,
): void {
    const attractOptions = container.actualOptions.interactivity.modes.attract;

    if (!attractOptions) {
        return;
    }

    const query = container.particles.quadTree.query(area, queryCb);

    for (const particle of query) {
        const { dx, dy, distance } = getDistances(particle.position, position),
            velocity = attractOptions.speed * attractOptions.factor,
            attractFactor = clamp(
                getEasing(attractOptions.easing)(identity - distance / attractRadius) * velocity,
                minFactor,
                attractOptions.maxSpeed,
            ),
            normVec = Vector.create(
                !distance ? velocity : (dx / distance) * attractFactor,
                !distance ? velocity : (dy / distance) * attractFactor,
            );

        particle.position.subFrom(normVec);
    }
}

/**
 *
 * @param container -
 * @param enabledCb -
 */
export function clickAttract(container: AttractContainer, enabledCb: (particle: Particle) => boolean): void {
    if (!container.attract) {
        container.attract = { particles: [] };
    }

    const { attract } = container;

    if (!attract.finish) {
        if (!attract.count) {
            attract.count = 0;
        }

        attract.count++;

        if (attract.count === container.particles.count) {
            attract.finish = true;
        }
    }

    if (attract.clicking) {
        const mousePos = container.interactivity.mouse.clickPosition,
            attractRadius = container.retina.attractModeDistance;

        if (!attractRadius || attractRadius < minRadius || !mousePos) {
            return;
        }

        processAttract(
            container,
            mousePos,
            attractRadius,
            new Circle(mousePos.x, mousePos.y, attractRadius),
            (p: Particle) => enabledCb(p),
        );
    } else if (attract.clicking === false) {
        attract.particles = [];
    }
}

/**
 *
 * @param container -
 * @param enabledCb -
 */
export function hoverAttract(container: AttractContainer, enabledCb: (particle: Particle) => boolean): void {
    const mousePos = container.interactivity.mouse.position,
        attractRadius = container.retina.attractModeDistance;

    if (!attractRadius || attractRadius < minRadius || !mousePos) {
        return;
    }

    processAttract(
        container,
        mousePos,
        attractRadius,
        new Circle(mousePos.x, mousePos.y, attractRadius),
        (p: Particle) => enabledCb(p),
    );
}
