import {
    type Container,
    type IDelta,
    OutMode,
    OutModeDirection,
    type Particle,
    ParticleOutType,
    Vector,
    calculateBounds,
    getDistances,
    getRandom,
    isPointInside,
    randomInRange,
} from "@tsparticles/engine";
import type { IOutModeManager } from "./IOutModeManager.js";

const minVelocity = 0,
    minDistance = 0;

export class OutOutMode implements IOutModeManager {
    modes: (OutMode | keyof typeof OutMode)[];

    constructor(private readonly container: Container) {
        this.modes = [OutMode.out];
    }

    async update(
        particle: Particle,
        direction: OutModeDirection,
        delta: IDelta,
        outMode: OutMode | keyof typeof OutMode,
    ): Promise<void> {
        if (!this.modes.includes(outMode)) {
            return;
        }

        const container = this.container;

        switch (particle.outType) {
            case ParticleOutType.inside: {
                const { x: vx, y: vy } = particle.velocity;

                const circVec = Vector.origin;

                circVec.length = particle.moveCenter.radius;
                circVec.angle = particle.velocity.angle + Math.PI;

                circVec.addTo(Vector.create(particle.moveCenter));

                const { dx, dy } = getDistances(particle.position, circVec);

                if (
                    (vx <= minVelocity && dx >= minDistance) ||
                    (vy <= minVelocity && dy >= minDistance) ||
                    (vx >= minVelocity && dx <= minDistance) ||
                    (vy >= minVelocity && dy <= minDistance)
                ) {
                    return;
                }

                particle.position.x = Math.floor(
                    randomInRange({
                        min: 0,
                        max: container.canvas.size.width,
                    }),
                );
                particle.position.y = Math.floor(
                    randomInRange({
                        min: 0,
                        max: container.canvas.size.height,
                    }),
                );

                const { dx: newDx, dy: newDy } = getDistances(particle.position, particle.moveCenter);

                particle.direction = Math.atan2(-newDy, -newDx);
                particle.velocity.angle = particle.direction;

                break;
            }
            default: {
                if (
                    isPointInside(
                        particle.position,
                        container.canvas.size,
                        Vector.origin,
                        particle.getRadius(),
                        direction,
                    )
                ) {
                    return;
                }

                switch (particle.outType) {
                    case ParticleOutType.outside: {
                        particle.position.x =
                            Math.floor(
                                randomInRange({
                                    min: -particle.moveCenter.radius,
                                    max: particle.moveCenter.radius,
                                }),
                            ) + particle.moveCenter.x;
                        particle.position.y =
                            Math.floor(
                                randomInRange({
                                    min: -particle.moveCenter.radius,
                                    max: particle.moveCenter.radius,
                                }),
                            ) + particle.moveCenter.y;

                        const { dx, dy } = getDistances(particle.position, particle.moveCenter);

                        if (particle.moveCenter.radius) {
                            particle.direction = Math.atan2(dy, dx);

                            particle.velocity.angle = particle.direction;
                        }

                        break;
                    }

                    case ParticleOutType.normal: {
                        const warp = particle.options.move.warp,
                            canvasSize = container.canvas.size,
                            newPos = {
                                bottom: canvasSize.height + particle.getRadius() + particle.offset.y,
                                left: -particle.getRadius() - particle.offset.x,
                                right: canvasSize.width + particle.getRadius() + particle.offset.x,
                                top: -particle.getRadius() - particle.offset.y,
                            },
                            sizeValue = particle.getRadius(),
                            nextBounds = calculateBounds(particle.position, sizeValue);

                        if (
                            direction === OutModeDirection.right &&
                            nextBounds.left > canvasSize.width + particle.offset.x
                        ) {
                            particle.position.x = newPos.left;
                            particle.initialPosition.x = particle.position.x;

                            if (!warp) {
                                particle.position.y = getRandom() * canvasSize.height;
                                particle.initialPosition.y = particle.position.y;
                            }
                        } else if (direction === OutModeDirection.left && nextBounds.right < -particle.offset.x) {
                            particle.position.x = newPos.right;
                            particle.initialPosition.x = particle.position.x;

                            if (!warp) {
                                particle.position.y = getRandom() * canvasSize.height;
                                particle.initialPosition.y = particle.position.y;
                            }
                        }

                        if (
                            direction === OutModeDirection.bottom &&
                            nextBounds.top > canvasSize.height + particle.offset.y
                        ) {
                            if (!warp) {
                                particle.position.x = getRandom() * canvasSize.width;
                                particle.initialPosition.x = particle.position.x;
                            }

                            particle.position.y = newPos.top;
                            particle.initialPosition.y = particle.position.y;
                        } else if (direction === OutModeDirection.top && nextBounds.bottom < -particle.offset.y) {
                            if (!warp) {
                                particle.position.x = getRandom() * canvasSize.width;
                                particle.initialPosition.x = particle.position.x;
                            }

                            particle.position.y = newPos.bottom;
                            particle.initialPosition.y = particle.position.y;
                        }

                        break;
                    }
                }

                break;
            }
        }

        await Promise.resolve();
    }
}
