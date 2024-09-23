# Hardat-Lotteria-Smartcontract

In questo progetto vogliamo realizzare una lotteria completamente decentralizzata, automatizzata e a prova di manomissione.

> 🧪 Grazie a questo progetto imparerai ad utilizzare e integrare altri 2 strumenti
> di fondamentale importanza per lo sviluppo di smart contracts avanzati
> Chainlink VRF e Chainlink Automations

Il contratto `Raffle.sol` implementa una lotteria decentralizzata. Gli utenti possono entrare nella lotteria pagando una quota di ingresso. A intervalli prestabiliti, il contratto utilizza Chainlink VRF per generare un numero casuale verificabile, selezionando un vincitore in modo trasparente e sicuro. Chainlink Automation (Keepers) garantisce che il processo sia completamente automatizzato, controllando periodicamente lo stato della lotteria e innescando l'estrazione del vincitore. Alla fine del processo, il contratto invia l'intero saldo al vincitore e riapre la lotteria per il ciclo successivo.

## Dettagli smart contract

### Funzioni

#### `enterRaffle()`

Questa funzione permette a chiunque di partecipare alla lotteria pagando una quota (fee) di ingresso.

-   Non accetta parametri in input.
-   Non ha parametri in output.
-   È una funzione pagabile (payable).
-   Condizioni:
    -   Reverta se il valore in ETH trasferito è inferiore alla quota di partecipazione.
    -   Reverta se la lotteria non è aperta.
-   Aggiunge il nuovo giocatore all'array `s_players`.
-   Emette un evento `RaffleEnter` entra un nuovo giocatore.

#### `checkUpkeep()`

La funzione chiamata dai nodi Chainlink Keepers per verificare se è necessario eseguire il processo di estrazione.

-   Parametri in input:
    -   `bytes memory /*checkData*/` inutilizzato in questo caso ma dovremo comunque passare un `bytes` vuoto o di lunghezza zero.
-   Parametri in output:
    -   `bool upkeepNeeded` vero se è necessario innescare l'automazione.
    -   `bytes memory /* performData */` inutilizzato in questo caso ma dovremo comunque passare un `bytes` vuoto o di lunghezza zero.
-   Condizioni affinché la funzione `performUpKeep()` venga triggerata:
    -   La lotteria è aperta `isOpen == true`.
    -   È passato abbastanza tempo `timePassed == true` (se l'intervallo di tempo passato è maggiore dell'intevallo definito `i_interval` per performare l'upKeep).
    -   C'è almeno un giocatore `hasPlayers == true`.
    -   Il contratto ha un saldo positivo `hasBalance == true`.
    -   Modifica a `true` il valore di `upKeepNeeded` se `isOpen`, `timePassed`, `hasPlayers` e `hasBalance` sono tutte `true`
-   Se tutte le condizioni sono soddisfatte, ritorna `upkeepNeeded = true`.

#### `performUpKeep()`

Viene chiamata automaticamente se `checkUpkeep()` ritorna true. Inizia il processo per selezionare un vincitore.

-   Parametri in input:
    -   `bytes memory /* performData */ ` inutilizzato in questo caso ma dovremo comunque passare un `bytes` vuoto o di lunghezza zero.
-   Non ha parametri in output.
-   Condizioni:
    -   Reverta se `checkUpKeep()` è false.
-   Azioni:
    -   Chiama la funzione `checkUpKeep()` e salva in `bool upKeepNeeded` un valore `true` o `false`
    -   Aggiorna a "calcolando" la variabile contenente lo stato della lotteria `s_raffleState`.
    -   Chiama la funzione `requestRandomWords()` che richiede numeri casuali tramite Chainlink VRF.

#### `requestRandomWords()`

Richiede numeri casuali a Chainlink VRF.

-   Parametri in input:
    -   `i_gasLane` Limite del gas massimo accettato.
    -   `i_subscriptionId ID` della sottoscrizione Chainlink VRF.
    -   `REQUEST_CONFIRMATIONS` Numero di conferme richieste.
    -   `i_callbackGasLimit` Limite del gas per l’esecuzione della callback.
    -   `NUM_WORDS` Numero di numeri casuali richiesti.
-   Paremetri in output:
    -   `requestId` Id della richiesta.
-   Eventi:
    -   Emette un evento `RequestedRaffleWinner` con l'Id della richiesta `requestId`

#### `fulfillRandomWords()`

Riceve il numero casuale generato da Chainlink VRF e determina il vincitore.

-   Parametri in input:
    -   `requestId` L'Id della richiesta associata al numero randomico ricevuto
    -   `uint256[] calldata randomWords` Un array di numeri random ricevuti (la quantità di numeri ricevuti dipende da quantio ne abbiamo precedentemente richiesti)
-   Non ha parametri in output
-   Condizioni:
    -   Reverta se il trasferimento dei fondi al vincitore fallisce.
-   Azioni:
    -   Calcola l'indice del vincitore `uint256 indexOfWinner`.
    -   Aggiorna il vincitore corrente `s_lastWinner`.
    -   Inizializza l'array dei giocatori `s_players`.
    -   Trasferisce l'intero saldo al vincitore e riapre la lotteria.
    -   Emette l'evento WinnerPicked.
    -   Aggiorna lo stato della lotteria `s_raffleState` a "OPEN" .
    -   Aggiorna all'ora attuale `s_lastTimeStamp`
    -   Trasferisce l'intero saldo del contratto al vincitore
-   Eventi:
    -   Emette un evento `WinnerPicked()` con l'ultimo vincitore `s_lastWinner`

### Funzioni Getter

`getRequestConfirmations()`
Ritorna il numero di conferme richieste per la richiesta VRF.

`getNumWords()`
Ritorna il numero di numeri casuali richiesti. In questo contratto è impostato a 1.

`getRecentWinner()`
Ritorna l'indirizzo dell'ultimo vincitore.

`getPlayer()`
Ritorna l'indirizzo del giocatore in un indice specifico.

`getLastTimeStamp()`
Ritorna l'ultimo timestamp in cui è stato estratto un vincitore.

`getInterval()`
Ritorna l'intervallo di tempo tra le estrazioni della lotteria.

`getEntranceFee()`
Ritorna la quota di partecipazione per entrare nella lotteria.

`getNumberOfPlayers()`
Ritorna il numero di giocatori attualmente iscritti alla lotteria.

### Variabili di stato (State Variabbles)

#### Variabili di Chainlink VRF

-   `uint256 immutable i_subscriptionId` ID della sottoscrizione VRF.
-   `bytes32 private immutable i_gasLane` Limite massimo del gas per la richiesta VRF.
-   `uint32 private immutable i_callbackGasLimit` Limite massimo del gas per la callback VRF.
-   `uint16 private constant REQUEST_CONFIRMATIONS` Numero di conferme richieste prima che venga restituito un numero casuale.
-   `uint32 private constant NUM_WORDS` Numero di numeri casuali richiesti.
-   `uint256[] public s_randomWords` Array per memorizzare i numeri casuali generati.

#### Variabili della Lotteria

-   `uint256 private immutable i_interval` Intervallo di tempo tra una lotteria e l'altra.
-   `uint256 private immutable i_entranceFee` Quota di ingresso per partecipare alla lotteria.
-   `uint256 private s_lastTimeStamp` Timestamp dell'ultima estrazione.
-   `address private s_lastWinner` Indirizzo dell'ultimo vincitore.
-   `address payable[] private s_players` Array dei partecipanti alla lotteria.
-   `RaffleState private s_raffleState` Stato della lotteria "OPEN" o "CALCULATING".

### Errori

-   `error Raffle__UpKeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState)` Triggerato quando l'upkeep non è necessario.
-   `error Raffle__TransferToLastWinnerFailed()` Triggerato se il trasferimento al vincitore fallisce.

-   `error Raffle__SendMoreToEnterRaffle()` Triggerato quando il giocatore invia meno ETH rispetto alla quota richiesta.
-   `error Raffle__NotOpen()` Triggerato quando qualcuno cerca di partecipare a una lotteria chiusa.

### Dichiarazione di tipi

-   `enum RaffleState{ OPEN, CALCULATING }` Definisce gli stati della lotteria.

## Eventi

-   `event RequestedRaffleWinner(uint256 indexed requestId)` Emette l'ID della richiesta quando si richiedono numeri casuali.
-   `event RaffleEnter(address indexed player)` Emette l'indirizzo del giocatore quando entra nella lotteria.
-   `event WinnerPicked(address indexed player)` Emette l'indirizzo del vincitore quando viene selezionato.

## Automazioni verificabilmente randomiche

> ❓ Come possiamo estrarre davvero **randomicamente** il vincitore?
> <descrivere il problema della randomicità>

Chainlink VRF (Verifiable Random Function) è un generatore di numeri casuali (RNG) dimostrabilmente equo e verificabile che consente agli smart contract di accedere a valori casuali senza compromettere la sicurezza o l'usabilità. Per ogni richiesta, Chainlink VRF genera uno o più valori casuali e una prova crittografica di come tali valori sono stati determinati. La prova viene pubblicata e verificata on-chain prima che qualsiasi applicazione che ne faccia uso possa accedervi. Questo processo garantisce che i risultati non possano essere alterati o manipolati da nessuna entità singola, inclusi operatori di oracoli, miner, utenti o sviluppatori di smart contract.

**Fonte**: [Chainlink VRF](https://docs.chain.link/vrf)
