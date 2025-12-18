import 'reflect-metadata';

const TIER_GATED_RESPONSE_KEY = Symbol('tierGatedResponse');

/**
 * Method decorator to mark a controller method as returning a tier-gated response.
 * Used with the TierGatingInterceptor to automatically strip fields based on user's tier.
 *
 * @param responseClass - The DTO class that has @RequiresTier decorated properties
 *
 * @example
 * ```typescript
 * @TierGatedResponse(NumberDetailResponseDto)
 * @post('/number-detail')
 * async getNumberDetail(...): Promise<NumberDetailResponseDto> { ... }
 * ```
 */
export function TierGatedResponse(responseClass: Function): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(TIER_GATED_RESPONSE_KEY, responseClass, target, propertyKey);
    return descriptor;
  };
}

/**
 * Get the response class marked with @TierGatedResponse for a method
 */
export function getTierGatedResponseClass(
  target: object,
  propertyKey: string | symbol,
): Function | undefined {
  return Reflect.getMetadata(TIER_GATED_RESPONSE_KEY, target, propertyKey);
}
