// Login com extensão Alby
async function loginWithAlby() {
  if (window.nostr) {
      try {
          const pubkeyFromAlby = await window.nostr.getPublicKey();
          localStorage.setItem('pubkey', pubkeyFromAlby);  // Salva a pubkey no 
          document.getElementById('pubkey').value = pubkeyFromAlby;
      } catch (e) {
          console.error('Erro ao autenticar com Alby: ', e);
          alert('Erro ao autenticar com Alby. Verifique se você concedeu permissão.');
      }
  } else {
      alert('Extensão Nostr (Alby) não detectada! Por favor, instale uma extensão compatível.');
  }
}
function resetPubkey(){
  document.getElementById('pubkey').value = "";

}

const defaultRelays = [
  "wss://nos.lol/",
  "wss://relay.primal.net/",
  "wss://relay.damus.io/",
  "wss://cobrafuma.com/relay",
  "wss://nostr.wine/",
  "wss://relay.snort.social/",
  "wss://relay.nostr.band/",
  "wss://nostr.land/",
  "wss://purplerelay.com/",
];

document.getElementById("relays").value = defaultRelays;


let webSocketConnections = [];
let receivedMessages = new Set();
let sentMessages = 0;

async function connectToRelays(pubkey, relays, relayTargets) {
  const relaysOkElement = document.getElementById("relaysOk")
  relaysOkElement.innerHTML = "";
  const relaysFailedElement = document.getElementById("relaysFailed")
  relaysFailedElement.innerHTML = "";

  const relayPromises = relays.map((relay) => {
      return new Promise((resolve, reject) => {
          
          const ws = new WebSocket(relay.replace("ws:", "wss:"));
          let randon = Math.floor(Math.random() * (99999 - 0 + 1)) + 0;
          ws.info = randon;
          webSocketConnections.push(ws);

          ws.onopen = () => {

              const subscriptionId = "sub-" + ws.url + randon;
              const message = JSON.stringify([
                  "REQ",
                  subscriptionId,
                  {
                      "authors": [pubkey],
                      "kinds": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 40, 41, 42, 43, 44, 64, 818, 1021, 1022, 1040, 1059, 1063, 1111, 1311, 1617, 1621, 1622, 1630, 1631, 1632, 1633, 1971, 1984, 1985, 1986, 1987, 2003, 2004, 2022, 4550, 5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010, 6000, 6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010, 7000, 7374, 7375, 7376, 9000, 9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008, 9009, 9010, 9011, 9012, 9013, 9014, 9015, 9016, 9017, 9018, 9019, 9020, 9021, 9022, 9023, 9024, 9025, 9026, 9027, 9028, 9029, 9030, 9041, 9321, 9467, 9734, 9735, 9802, 10000, 10001, 10002, 10003, 10004, 10005, 10006, 10007, 10009, 10015, 10019, 10030, 10050, 10063, 10096, 10115, 10116, 13194, 21000, 22242, 23194, 23195, 24133, 24242, 27235, 30000, 30001, 30002, 30003, 30004, 30005, 30007, 30008, 30009, 30015, 30017, 30018, 30019, 30020, 30023, 30024, 30030, 30040, 30041, 30063, 30078, 30311, 30315, 30388, 30402, 30403, 30617, 30618, 30818, 30819, 31388, 31890, 31922, 31923, 31924, 31925, 31989, 31990, 34235, 34236, 34550, 37375, 38383, 39000, 39001, 39002, 39003, 39004, 39005, 39006, 39007, 39008, 39009]

                  }
              ]);
              ws.send(message);

              // Adiciona relay na lista de sucesso
              const li = document.createElement("li");
              li.textContent = ws.url;
              relaysOkElement.appendChild(li);

          };

          ws.onmessage = (event) => {

              try {
                  const messageArray = JSON.parse(event.data);
                  if (Array.isArray(messageArray) && messageArray.length > 1) {
                      messageArray.splice(1, 1);  // Remove a posição 1, referente ao sub
                  }

                  // Verifique se o pubkey está na mensagem antes de adicionar, evitando assim mensagens EOSE, CLOSE, AUTH e etc ..
                  const messageString = JSON.stringify(messageArray);
                  const messageContainsPubkey = messageString.includes(pubkey);
                  const includeEOSE = messageString.includes("EOSE")
                  const includeAUTH = messageString.includes("AUTH")

                  if (includeEOSE || includeAUTH) {
                      resolve();
                  }

                  else if (messageContainsPubkey && !receivedMessages.has(messageString)) {
                      receivedMessages.add(messageString);
                      document.getElementById("receivedCount").textContent = receivedMessages.size;
                  }

              } catch (error) {
                  console.error(`Error processing message from ${relay}:`, error);
              }
          };

          ws.onerror = (error) => {
              console.error(`Error connecting to ${relay}:`, error);

              // Adiciona relay na lista de falha
              const li = document.createElement("li");
              li.textContent = relay;
              relaysFailedElement.appendChild(li);

          };

          ws.onclose = () => {
              // webSocketConnections[webSocketConnections.indexOf(ws)] = null;
              resolve();
          };

          // Timeout para garantir que a função seja encerrada após 5 segundos
          // setTimeout(() => {
          //     if (ws.readyState !== WebSocket.CLOSED) {
          //         //ws.close();  // Fecha a conexão caso não tenha recebido mensagens em 5 segundos
          //         //                            console.log(`Connection to ${relay} closed due to timeout..`);
          //        // resolve();
          //     }
          // }, 5000);  // 5 segundos
      });

  });

  // Aguarda até que todas as promessas sejam resolvidas (conexões encerradas)
  await Promise.all(relayPromises);
  await sendMessagesToRelay(relayTargets);

}

function sendMessagesToRelay(relayTargets) {
  const relaysTargetArray = relayTargets.split(',').map(target => target.trim()); // Divide e limpa as URLs
  return new Promise((resolve, reject) => {
      console.log(`Total messages received: ${receivedMessages.size}`);

      for (const relayTarget of relaysTargetArray) {
          try {
              const targetWs = new WebSocket(relayTarget.replace("ws:", "wss:"));
              let randon = Math.floor(Math.random() * (99999 - 0 + 1)) + 0;
              targetWs.info = randon;
              webSocketConnections.push(targetWs);
              const relaysOkElement = document.getElementById("relaysOk");

              targetWs.onopen = () => {
                  console.info(`Open connection to target relay: ${relayTarget}`);
                  // Envia todas as mensagens recebidas para o relay alvo
                  receivedMessages.forEach((message) => {
                      targetWs.send(message);  // Envia a mensagem
                      sentMessages++;  // Incrementa o contador de mensagens enviadas
                      document.getElementById("sentCount").textContent = sentMessages;  // Atualiza o contador na interface
                  });
                  console.info(`${sentMessages} messages sent to ${relayTarget}`);
                  sentMessages = 0;

                  const li = document.createElement("li");
                  li.textContent = targetWs.url;
                  relaysOkElement.appendChild(li);


                  // Resolve a promise depois de enviar todas as mensagens
                  resolve();
              };

              targetWs.onerror = (error) => {
                  console.error(`Error connecting to target relay (${relayTarget}):`, error);
                  // Adiciona relay na lista de falha
                  const li = document.createElement("li");
                  li.textContent = targetWs.url;
                  relaysFailedElement.appendChild(li);
                  reject(error); // Rejeita a promise em caso de erro
              };

              targetWs.onclose = () => {
                  console.log(`Closed connection with target relay: ${relayTarget}`);
                  resolve();
              };
          } catch (error) {
              console.error(`Erro ao conectar ao relay ${relayTarget}:`, error);
              reject();
          }
      }
  });
}
function closeAllConnections() {
  webSocketConnections.forEach((ws) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
          const subscription = "sub-" + ws.url + ws.info;
          const closeMessage = JSON.stringify(["CLOSE", subscription]);
          ws.send(closeMessage);
          // Fechar o WebSocket após enviar todas as mensagens
          ws.close();
      }

  });
  
  // Atualizar indicadores na interface
  document.getElementById("loadingIndicator").style.display = "none";
  document.getElementById("finishIndicator").style.display = "block";
  document.getElementById("getEvents").style.display = "block";
  const relaysOkElement = document.getElementById("relaysOk").innerHTML = "";
  console.log('All WebSocket connections processed.');
  console.log('Finish');

}

function isValidPubkey(pubkey) {
  // A pubkey deve ter 64 caracteres hexadecimais
  const hexPattern = /^[0-9a-fA-F]{64}$/;
  return hexPattern.test(pubkey);
}

// Substitui os métodos padrão do console para exibir na interface
(function overrideConsole() {
  if (!window.consoleOverridden) {  // Verifica se já foi feito o override
      const originalLog = console.log;
      const originalError = console.error;
      const originalInfo = console.info;


      console.log = (...args) => {
          appendToLog(args.join(" "), "log");
          originalLog.apply(console, args); // Chama o método original
      };

      console.error = (...args) => {
          appendToLog(args.join(" "), "error");
          originalError.apply(console, args); // Chama o método original
      };
      console.info = (...args) => {
          appendToLog(args.join(" "), "info");
          originalInfo.apply(console, args); // Chama o método original
      };

      window.consoleOverridden = true; // Marca que o override foi feito
  }
})();

// Função para adicionar logs na interface
function appendToLog(message, type = "log") {
  const logOutput = document.getElementById("logOutput");
  const logMessage = document.createElement("div");
  logMessage.textContent = message;

  // Adicionar classe com base no tipo (log, error, etc.)
  logMessage.className = type === "error" ? "text-danger" : "text-light";

  logOutput.appendChild(logMessage);

  // Rolagem automática para a última mensagem
  logOutput.scrollTop = logOutput.scrollHeight;
}

async function updateBase() {

  document.getElementById("receivedCount").innerHTML = "0";
  document.getElementById("sentCount").innerHTML = "0";
  document.getElementById("logOutput").innerHTML = "";
  console.clear();
  webSocketConnections = [];
  receivedMessages.clear();
  sentMessages = 0;
  const pubkey = document.getElementById("pubkey").value.trim();
  const relayInput = document.getElementById("relays").value.trim();
  const relayTargets = document.getElementById("relayAlvo").value.trim();

  if (!pubkey) {
      alert("Please enter pubkey.");
      return;
  }

  if (!isValidPubkey(pubkey)) {
      alert("Invalid pubkey format. Please enter a valid pubkey.");
      return;
  }

  const relays = relayInput
      ? relayInput.split(",").map((relay) => relay.trim())
      : defaultRelays;

  if (!relayTargets) {
      alert("Please enter the target relay.");
      return;
  }

  // Exibe o indicador de carregamento
  document.getElementById("loadingIndicator").style.display = "block";

  document.getElementById("finishIndicator").style.display = "none";
  document.getElementById("getEvents").style.display = "none";


  try {
      // Conecta aos relays e envia mensagens
      console.log(`Starting connections with relays...`);
      await connectToRelays(pubkey, relays, relayTargets);


  } catch (error) {
      console.error("Error during process:", error);
      alert("An error occurred while processing connections");
  } finally {
      await new Promise((resolve) => setTimeout(resolve, 7000));
      await closeAllConnections();  // Fecha todas as conexões ao finalizar  

  }
}

// Event listener para o botão
document.getElementById("getEvents").addEventListener("click", updateBase);