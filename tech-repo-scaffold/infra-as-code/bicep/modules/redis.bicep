// Azure Redis Cache
param name string
param location string
param skuName string = 'Basic'
param capacity int = 0

resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: name
  location: location
  properties: {
    sku: {
      name: skuName
      family: 'C'
      capacity: capacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

output id string = redis.id
output hostName string = redis.properties.hostName
output port int = redis.properties.sslPort
