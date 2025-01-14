import { type Container, type IMovePathGenerator, Vector, getRandom, isFunction, isString } from "@tsparticles/engine";
import type { CurvesPathParticle } from "./CurvesPathParticle.js";
import type { ICurvesOptions } from "./ICurvesOptions.js";

const double = 2,
    doublePI = Math.PI * double;

/**
 * @returns a random velocity
 */
function randomVelocity(): number {
    const offset = 0.8,
        factor = 0.6;

    return getRandom() * factor + offset;
}

export class CurvesPathGenerator implements IMovePathGenerator {
    readonly options: ICurvesOptions;

    constructor() {
        this.options = {
            rndFunc: null,
            period: 100,
            nbHarmonics: 2,
            attenHarmonics: 0.8,
            lowValue: -0.03,
            highValue: 0.03,
        };
    }

    async generate(p: CurvesPathParticle): Promise<Vector> {
        if (!p.pathGen) {
            const options = this.options,
                { CurvesPathGen } = await import("./Curves.js");

            p.pathGen = CurvesPathGen(
                options.rndFunc,
                options.period,
                options.nbHarmonics,
                options.attenHarmonics,
                options.lowValue,
                options.highValue,
            );
        }

        if (!p.curveVelocity) {
            p.curveVelocity = Vector.origin;

            p.curveVelocity.length = randomVelocity();
            p.curveVelocity.angle = getRandom() * doublePI;
        } else {
            p.curveVelocity.length += 0.01;
            p.curveVelocity.angle = (p.curveVelocity.angle + p.pathGen()) % doublePI;
        }

        p.velocity.x = 0;
        p.velocity.y = 0;

        return p.curveVelocity;
    }

    async init(container: Container): Promise<void> {
        const sourceOptions = container.actualOptions.particles.move.path.options,
            { options } = this;

        if (isFunction(sourceOptions.rndFunc)) {
            options.rndFunc = sourceOptions.rndFunc as () => number;
        } else if (isString(sourceOptions.rndFunc)) {
            options.rndFunc =
                ((window as unknown as Record<string, unknown>)[sourceOptions.rndFunc] as
                    | (() => number)
                    | null
                    | undefined) ?? this.options.rndFunc;
        }

        options.period = (sourceOptions.period as number) ?? options.period;
        options.nbHarmonics = (sourceOptions.nbHarmonics as number) ?? options.nbHarmonics;
        options.attenHarmonics = (sourceOptions.attenHarmonics as number) ?? options.attenHarmonics;
        options.lowValue = (sourceOptions.lowValue as number) ?? options.lowValue;
        options.highValue = (sourceOptions.highValue as number) ?? options.highValue;

        await Promise.resolve();
    }

    reset(particle: CurvesPathParticle): void {
        delete particle.pathGen;
        delete particle.curveVelocity;
    }

    update(): void {
        // do nothing
    }
}
