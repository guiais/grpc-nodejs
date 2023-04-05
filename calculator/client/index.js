const grpc = require('@grpc/grpc-js')
const { CalculatorClient } = require('../proto/calculator_grpc_pb')
const { SumRequest } = require('../proto/sum_pb')
const { FactorRequest } = require('../proto/factor_pb')
const { AvgRequest } = require('../proto/avg_pb')

/**
 *
 * @param {grpc.ServiceClientConstructor} client
 */
async function sum(client, { firstNumber, secondNumber }) {
  const request = new SumRequest()
    .setFirstNumber(firstNumber)
    .setSecondNumber(secondNumber)

  return new Promise((resolve, reject) => {
    client.sum(request, (err, response) => {
      if (err) {
        reject(err)
      } else {
        resolve(response)
      }
    })
  })
}

async function getFactors(client, { numberToFactor }) {
  const request = new FactorRequest()
  request.setNumberToFactor(numberToFactor)

  const streamOfFactors = client.getFactors(request)

  const factors = []

  for await (const iterator of streamOfFactors) {
    factors.push(iterator.getNumber())
  }

  return factors
}

function getAvg(client) {
  const numbers = [1, 2, 3, 4]

  return new Promise((resolve, reject) => {
    const writable = client.getAvg((err, response) => {
      if (err) {
        return reject(err)
      }

      resolve(response.getNumber())
    })

    numbers.map(number => writable.write(new AvgRequest().setNumber(number)))

    writable.end()
  })
}

async function main() {
  const credentails = grpc.ChannelCredentials.createInsecure()
  const client = new CalculatorClient('localhost:50051', credentails)

  const sumResponse = await sum(client, {
    firstNumber: 10,
    secondNumber: 2000,
  })
  console.log(`[Sum]: `, sumResponse.getResult())

  const factors = await getFactors(client, {
    numberToFactor: 100,
  })

  console.log(`[Factors]: `, factors)

  const avgResponse = await getAvg(client)

  console.log(`[Avg]: `, avgResponse)

  client.close()
}

main()
