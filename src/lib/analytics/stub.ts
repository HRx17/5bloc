/**
 * Placeholder for the product-analytics SDK used by the original codebase.
 * Calls are no-ops until analytics is wired up again.
 */
type Props = Record<string, unknown>;

export const analytics = {
  track(_event: string, _props?: Props) {},
  setIdentity(_id: string, _props?: Props) {},
  identify(_id: string, _props?: Props) {},
  page(_name?: string, _props?: Props) {},
};

export default analytics;
