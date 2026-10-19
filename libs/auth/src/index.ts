import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AUTHZ_CHECKER } from './authz';
import { AuthenticationGuard, JWT_VERIFIER, PermissionsGuard } from './guards';

export * from './authz';
export * from './decorators';
export * from './guards';
export * from './jwt-verifier';
export * from './principal';

interface FactoryProvider<T> {
  inject?: unknown[];
  useFactory: (...deps: never[]) => T | Promise<T>;
}

export interface AuthModuleOptions {
  verifier: FactoryProvider<unknown>;
  /**
   * Decides scoped permissions. Omit when another global module already provides AUTHZ_CHECKER
   * (IAM answers locally), or to allow org-level permissions only.
   */
  authzChecker?: FactoryProvider<unknown>;
}

/** Registers the global authentication and permission guards. */
@Global()
@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    const providers: Provider[] = [
      { provide: JWT_VERIFIER, inject: (options.verifier.inject ?? []) as never[], useFactory: options.verifier.useFactory },
      { provide: APP_GUARD, useClass: AuthenticationGuard },
      { provide: APP_GUARD, useClass: PermissionsGuard },
    ];
    if (options.authzChecker) {
      providers.push({
        provide: AUTHZ_CHECKER,
        inject: (options.authzChecker.inject ?? []) as never[],
        useFactory: options.authzChecker.useFactory,
      });
    }
    return { module: AuthModule, providers, exports: [JWT_VERIFIER, ...(options.authzChecker ? [AUTHZ_CHECKER] : [])] };
  }
}
