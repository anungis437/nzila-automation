// Azure PostgreSQL Flexible Server with pgvector
param name string
param location string
param administratorLogin string
@secure()
param administratorPassword string
param skuName string = 'Standard_B2s'
param tier string = 'Burstable'
param storageSizeGB int = 128
param version string = '15'

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: name
  location: location
  sku: {
    name: skuName
    tier: tier
  }
  properties: {
    version: version
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// Enable required extensions
resource extensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-03-01-preview' = {
  parent: postgres
  name: 'azure.extensions'
  properties: {
    value: 'uuid-ossp,pgvector,pg_trgm'
    source: 'user-override'
  }
}

output id string = postgres.id
output fqdn string = postgres.properties.fullyQualifiedDomainName
