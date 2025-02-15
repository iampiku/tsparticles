import {
    type Container,
    type IDelta,
    type IParticleUpdater,
    type Particle,
    getHslAnimationFromHsl,
    rangeColorToHsl,
    updateColor,
} from "@tsparticles/engine";

export class ColorUpdater implements IParticleUpdater {
    private readonly container;

    constructor(container: Container) {
        this.container = container;
    }

    async init(particle: Particle): Promise<void> {
        /* color */
        const hslColor = rangeColorToHsl(particle.options.color, particle.id, particle.options.reduceDuplicates);

        if (hslColor) {
            particle.color = getHslAnimationFromHsl(
                hslColor,
                particle.options.color.animation,
                this.container.retina.reduceFactor,
            );
        }

        await Promise.resolve();
    }

    isEnabled(particle: Particle): boolean {
        const { h: hAnimation, s: sAnimation, l: lAnimation } = particle.options.color.animation,
            { color } = particle;

        return (
            !particle.destroyed &&
            !particle.spawning &&
            ((color?.h.value !== undefined && hAnimation.enable) ||
                (color?.s.value !== undefined && sAnimation.enable) ||
                (color?.l.value !== undefined && lAnimation.enable))
        );
    }

    async update(particle: Particle, delta: IDelta): Promise<void> {
        updateColor(particle.color, delta);

        await Promise.resolve();
    }
}
