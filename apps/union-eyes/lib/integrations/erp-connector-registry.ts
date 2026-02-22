/**
 * ERP Connector Registry Initialization
 * 
 * Registers all available ERP connectors with the ERPConnectorRegistry.
 * This file should be imported early in the application lifecycle (e.g., in middleware or server.ts).
 */

import { ERPConnectorRegistry, type ERPConnectorConfig } from '@/packages/financial';
import { QuickBooksOnlineConnector } from '@/packages/financial/src/erp/connectors/quickbooks-online';
import { XeroConnector } from '@/packages/financial/src/erp/connectors/xero';

/**
 * Initialize ERP connectors
 * Call this function once during application startup to register all connectors
 */
export function initializeERPConnectors(): void {
  // Register QuickBooks Online
  ERPConnectorRegistry.register('quickbooks_online', (config: ERPConnectorConfig) => {
    return new QuickBooksOnlineConnector(config);
  });

  // Register Xero
  ERPConnectorRegistry.register('xero', (config: ERPConnectorConfig) => {
    return new XeroConnector(config);
  });

  // Future connectors can be registered here as they are implemented:
  // ERPConnectorRegistry.register('sage_intacct', (config) => new SageIntacctConnector(config));
  // ERPConnectorRegistry.register('sap_business_one', (config) => new SAPConnector(config));
  // ERPConnectorRegistry.register('microsoft_dynamics', (config) => new DynamicsConnector(config));
  // ERPConnectorRegistry.register('oracle_netsuite', (config) => new NetSuiteConnector(config));
}
