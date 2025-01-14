import {
    type Container,
    type IDelta,
    type IParticleUpdater,
    type Particle,
    type RecursivePartial,
    getRandom,
    getRangeValue,
    millisecondsToSeconds,
} from "@tsparticles/engine";
import type { ILifeParticlesOptions, LifeParticle, LifeParticlesOptions } from "./Types.js";
import { Life } from "./Options/Classes/Life.js";

const noTime = 0,
    identity = 1,
    infiniteValue = -1;

export class LifeUpdater implements IParticleUpdater {
    private readonly container;

    constructor(container: Container) {
        this.container = container;
    }

    async init(particle: LifeParticle): Promise<void> {
        const container = this.container,
            particlesOptions = particle.options,
            lifeOptions = particlesOptions.life;

        if (!lifeOptions) {
            return;
        }

        particle.life = {
            delay: container.retina.reduceFactor
                ? ((getRangeValue(lifeOptions.delay.value) * (lifeOptions.delay.sync ? identity : getRandom())) /
                      container.retina.reduceFactor) *
                  millisecondsToSeconds
                : noTime,
            delayTime: noTime,
            duration: container.retina.reduceFactor
                ? ((getRangeValue(lifeOptions.duration.value) * (lifeOptions.duration.sync ? identity : getRandom())) /
                      container.retina.reduceFactor) *
                  millisecondsToSeconds
                : noTime,
            time: noTime,
            count: lifeOptions.count,
        };

        if (particle.life.duration <= noTime) {
            particle.life.duration = infiniteValue;
        }

        if (particle.life.count <= noTime) {
            particle.life.count = infiniteValue;
        }

        if (particle.life) {
            particle.spawning = particle.life.delay > noTime;
        }

        await Promise.resolve();
    }

    isEnabled(particle: Particle): boolean {
        return !particle.destroyed;
    }

    loadOptions(
        options: LifeParticlesOptions,
        ...sources: (RecursivePartial<ILifeParticlesOptions> | undefined)[]
    ): void {
        if (!options.life) {
            options.life = new Life();
        }

        for (const source of sources) {
            options.life.load(source?.life);
        }
    }

    async update(particle: LifeParticle, delta: IDelta): Promise<void> {
        if (!this.isEnabled(particle) || !particle.life) {
            return;
        }

        const { updateLife } = await import("./Utils.js");

        updateLife(particle, delta, this.container.canvas.size);
    }
}
