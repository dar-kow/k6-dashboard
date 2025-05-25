import { Request, Response, NextFunction } from 'express';
import { IConfig } from '../../core/interfaces/common/IConfig';
import { ILogger } from '../../core/interfaces/common/ILogger';
import { Environment } from '../../config/Environment';

export class SystemController {
  constructor(
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {}

  getSystemInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting system information');

      // Get enhanced system config
      const systemConfig = (this.config as Environment).getSystemConfig();

      res.json({
        success: true,
        system: {
          name: systemConfig.name,
          version: systemConfig.version,
          description: systemConfig.description,
          repository: systemConfig.repository,
          testConfig: systemConfig.testConfig,
          availableEnvironments: Object.keys(systemConfig.environments),
        },
        dashboard: {
          version: process.env.npm_package_version || '2.0.0',
          nodeEnv: this.config.get('NODE_ENV'),
          uptime: process.uptime(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error getting system info', error as Error);
      next(error);
    }
  };

  getEnvironmentConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { environment } = req.params;

      if (!['PROD', 'DEV', 'STAGING'].includes(environment)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid environment. Must be PROD, DEV, or STAGING',
        });
      }

      this.logger.debug('Getting environment configuration', { environment });

      const systemConfig = (this.config as Environment).getSystemConfig();
      const envConfig =
        systemConfig.environments[environment as keyof typeof systemConfig.environments];

      if (!envConfig) {
        return res.status(404).json({
          success: false,
          error: `Environment ${environment} not configured`,
        });
      }

      // Don't expose API keys in response, just indicate if they're set
      res.json({
        success: true,
        environment: environment,
        config: {
          baseUrl: envConfig.baseUrl,
          hasApiKey: !!envConfig.apiKey,
          apiKeyLength: envConfig.apiKey ? envConfig.apiKey.length : 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error getting environment config', error as Error);
      next(error);
    }
  };

  getTestConfiguration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.debug('Getting test configuration');

      const systemConfig = (this.config as Environment).getSystemConfig();

      res.json({
        success: true,
        configuration: {
          system: {
            name: systemConfig.name,
            version: systemConfig.version,
            description: systemConfig.description,
          },
          environments: Object.keys(systemConfig.environments).map((env) => {
            const envConfig =
              systemConfig.environments[env as keyof typeof systemConfig.environments];
            return {
              name: env,
              baseUrl: envConfig?.baseUrl,
              hasApiKey: !!envConfig?.apiKey,
            };
          }),
          testDefaults: systemConfig.testConfig,
          repository: systemConfig.repository,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error getting test configuration', error as Error);
      next(error);
    }
  };
}
