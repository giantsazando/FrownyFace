/**
 * Odometer-style HP meter. Damage sets a target and the displayed value rolls
 * toward it over time. A combatant is only knocked out when the rolling value
 * actually reaches zero, so healing (or winning) in time saves them.
 */
export class RollingMeter {
  current: number;
  target: number;

  constructor(
    value: number,
    public max: number,
    public downRate = 10 + max * 0.08,
    public upRate = 40 + max * 0.4,
  ) {
    this.current = value;
    this.target = value;
  }

  get value(): number {
    return Math.max(0, Math.ceil(this.current - 1e-6));
  }

  get rolling(): boolean {
    return Math.abs(this.current - this.target) > 1e-6;
  }

  get empty(): boolean {
    return this.current <= 1e-6;
  }

  damage(n: number): void {
    this.target = Math.max(0, this.target - n);
  }

  heal(n: number): void {
    this.target = Math.min(this.max, this.target + n);
  }

  set(v: number): void {
    this.target = this.current = Math.max(0, Math.min(this.max, v));
  }

  /** Freeze at the currently displayed value (used on victory). */
  freeze(): void {
    this.target = this.current = this.value;
  }

  update(dt: number): void {
    if (this.current > this.target) this.current = Math.max(this.target, this.current - this.downRate * dt);
    else if (this.current < this.target) this.current = Math.min(this.target, this.current + this.upRate * dt);
  }
}
