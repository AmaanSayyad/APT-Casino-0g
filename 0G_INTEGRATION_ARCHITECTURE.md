# 0G Ecosystem Integration Architecture

Complete architecture diagram showing how all 0G services are integrated into the casino application.

## System Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend Layer (Next.js)"]
        UI[User Interface]
        Games[Game Components]
        Profile[User Profile]
        AI[AI Assistant]
    end

    subgraph API["API Layer"]
        GameAPI[Game API Routes]
        StorageAPI[Storage API Routes]
        ComputeAPI[Compute API Routes]
        DAAPI[DA API Routes]
    end

    subgraph Services["Service Layer"]
        GameService[Game History Service]
        StorageService[OGStorageService]
        ComputeService[useOGComputeNetwork]
        DAService[OGDAService]
    end

    subgraph OGChain["0G Chain (Galileo Testnet)"]
        ChainRPC[0G Chain RPC]
        Contracts[Smart Contracts]
        Treasury[Treasury Wallet]
    end

    subgraph OGCompute["0G Compute Network"]
        ComputeBroker[Compute Broker]
        Providers[AI Providers]
        GPT[GPT-OSS-120B]
        DeepSeek[DeepSeek-R1-70B]
    end

    subgraph OGDA["0G Data Availability"]
        DAClient[DA Client Node]
        DAEncoder[DA Encoder]
        DARetriever[DA Retriever]
        DABlobs[DA Blobs]
    end

    subgraph OGStorage["0G Storage Network"]
        Indexer[Storage Indexer]
        StorageNodes[Storage Nodes]
        KVStorage[Key-Value Storage]
        FileStorage[File Storage]
    end

    subgraph External["External Services"]
        PythEntropy[Pyth Entropy<br/>Arbitrum Sepolia]
        Database[(PostgreSQL)]
        Redis[(Redis Cache)]
    end

    %% Frontend to API
    UI --> GameAPI
    Games --> GameAPI
    Profile --> StorageAPI
    AI --> ComputeAPI

    %% API to Services
    GameAPI --> GameService
    StorageAPI --> StorageService
    ComputeAPI --> ComputeService
    DAAPI --> DAService

    %% Services to 0G Networks
    GameService --> DAAPI
    GameService --> StorageAPI
    StorageService --> OGStorage
    ComputeService --> OGCompute
    DAService --> OGDA

    %% 0G Chain Connections
    StorageService --> ChainRPC
    ComputeService --> ChainRPC
    DAService --> ChainRPC
    GameAPI --> Contracts
    Contracts --> ChainRPC
    Treasury --> ChainRPC

    %% 0G Compute Flow
    ComputeService --> ComputeBroker
    ComputeBroker --> Providers
    Providers --> GPT
    Providers --> DeepSeek
    ComputeBroker --> ChainRPC

    %% 0G DA Flow
    DAService --> DAClient
    DAClient --> DAEncoder
    DAClient --> DARetriever
    DAEncoder --> DABlobs
    DARetriever --> DABlobs
    DAClient --> ChainRPC

    %% 0G Storage Flow
    StorageService --> Indexer
    Indexer --> StorageNodes
    StorageService --> KVStorage
    StorageService --> FileStorage
    Indexer --> ChainRPC

    %% External Services
    GameAPI --> PythEntropy
    GameService --> Database
    GameAPI --> Redis

    style OGChain fill:#4a90e2
    style OGCompute fill:#50c878
    style OGDA fill:#ff6b6b
    style OGStorage fill:#ffa500
    style Frontend fill:#e8f4f8
    style API fill:#f0f0f0
    style Services fill:#fff9e6
```

## Data Flow Diagrams

### Game Result Flow

```mermaid
sequenceDiagram
    participant User
    participant Game
    participant GameAPI
    participant PythEntropy
    participant GameService
    participant DA
    participant Storage
    participant Database

    User->>Game: Play Game
    Game->>GameAPI: Request Randomness
    GameAPI->>PythEntropy: Request Entropy
    PythEntropy-->>GameAPI: Random Value
    GameAPI->>Game: Return Result
    
    Game->>GameAPI: Save Game Result
    GameAPI->>GameService: Process Result
    GameService->>Database: Save to PostgreSQL
    
    par Parallel Processing
        GameService->>DA: Submit to 0G DA
        DA-->>GameService: Blob Hash
    and
        GameService->>Storage: Backup to 0G Storage
        Storage-->>GameService: Root Hash
    end
    
    GameService-->>GameAPI: Complete
    GameAPI-->>User: Show Result
```

### AI Assistant Flow

```mermaid
sequenceDiagram
    participant User
    participant AI
    participant ComputeHook
    participant ComputeAPI
    participant ComputeBroker
    participant Provider
    participant OGChain

    User->>AI: Ask Question
    AI->>ComputeHook: sendInferenceRequest
    ComputeHook->>ComputeAPI: POST /api/og-compute
    
    ComputeAPI->>ComputeBroker: Initialize
    ComputeBroker->>OGChain: Check Balance
    OGChain-->>ComputeBroker: Balance OK
    
    ComputeAPI->>ComputeBroker: Discover Services
    ComputeBroker-->>ComputeAPI: Provider List
    
    ComputeAPI->>ComputeBroker: Acknowledge Provider
    ComputeBroker->>OGChain: On-chain Acknowledgement
    
    ComputeAPI->>ComputeBroker: Send Inference Request
    ComputeBroker->>Provider: Forward Request
    Provider-->>ComputeBroker: AI Response
    
    ComputeBroker->>OGChain: Process Payment
    ComputeBroker-->>ComputeAPI: Response
    ComputeAPI-->>ComputeHook: Return Result
    ComputeHook-->>AI: Display Response
    AI-->>User: Show Answer
```

### Storage Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant StorageAPI
    participant Indexer
    participant StorageNodes
    participant OGChain

    User->>Frontend: Upload File
    Frontend->>StorageAPI: POST /api/og-storage/upload
    
    StorageAPI->>Indexer: Select Nodes
    Indexer-->>StorageAPI: Node List
    
    StorageAPI->>StorageNodes: Upload File
    StorageAPI->>StorageAPI: Generate Merkle Tree
    StorageAPI->>StorageAPI: Calculate Root Hash
    
    StorageAPI->>OGChain: Submit Metadata
    OGChain-->>StorageAPI: Transaction Hash
    
    StorageAPI-->>Frontend: Root Hash + TX Hash
    Frontend-->>User: Upload Complete
```

### DA Blob Submission Flow

```mermaid
sequenceDiagram
    participant GameService
    participant DAAPI
    participant DAClient
    participant DAEncoder
    participant DARetriever
    participant OGChain

    GameService->>DAAPI: POST /api/og-da/submit
    DAAPI->>DAClient: Disperse Blob (gRPC)
    
    DAClient->>DAEncoder: Encode Data
    DAEncoder->>DAEncoder: Erasure Coding
    DAEncoder->>DAEncoder: Generate Proofs
    DAEncoder-->>DAClient: Encoded Data
    
    DAClient->>DARetriever: Distribute Slices
    DAClient->>OGChain: Submit Metadata
    OGChain-->>DAClient: Transaction Hash
    
    DAClient->>DARetriever: Wait for Signatures
    DARetriever-->>DAClient: Signed Slices
    
    DAClient->>OGChain: Submit Aggregated Signature
    OGChain-->>DAClient: Confirmed
    
    DAClient-->>DAAPI: Request ID + Blob Hash
    DAAPI-->>GameService: Submission Complete
```

## Component Integration Map

```mermaid
graph LR
    subgraph Casino["Casino Application"]
        A[Games]
        B[User Profiles]
        C[AI Assistant]
        D[Game History]
    end

    subgraph OG["0G Ecosystem"]
        E[0G Chain]
        F[0G Compute]
        G[0G DA]
        H[0G Storage]
    end

    A -->|Game Assets| H
    A -->|Game Results| G
    A -->|Game Results| D
    B -->|Avatars| H
    B -->|Profiles| H
    C -->|AI Requests| F
    D -->|Backups| H
    D -->|Audit Trails| G
    
    E -->|Transactions| A
    E -->|Transactions| B
    E -->|Transactions| C
    E -->|Transactions| D
    
    F -->|AI Responses| C
    G -->|Blob Hashes| D
    H -->|File Hashes| A
    H -->|File Hashes| B

    style Casino fill:#e8f4f8
    style OG fill:#4a90e2
```

## Network Topology

```mermaid
graph TB
    subgraph User["User"]
        Browser[Browser]
    end

    subgraph App["Casino Application"]
        NextJS[Next.js Server]
        API[API Routes]
    end

    subgraph OGTestnet["0G Testnet"]
        Chain[0G Chain<br/>RPC: evmrpc-testnet.0g.ai]
        ComputeNet[Compute Network<br/>Broker + Providers]
        DANet[DA Network<br/>Client + Encoder + Retriever]
        StorageNet[Storage Network<br/>Indexer + Nodes]
    end

    subgraph Arbitrum["Arbitrum Sepolia"]
        Pyth[Pyth Entropy]
    end

    subgraph Database["Database Layer"]
        PG[(PostgreSQL)]
        Redis[(Redis)]
    end

    Browser --> NextJS
    NextJS --> API
    
    API --> Chain
    API --> ComputeNet
    API --> DANet
    API --> StorageNet
    API --> Pyth
    API --> PG
    API --> Redis

    Chain --> ComputeNet
    Chain --> DANet
    Chain --> StorageNet

    style OGTestnet fill:#4a90e2
    style Arbitrum fill:#28a745
    style Database fill:#ffc107
```

## Storage Architecture

```mermaid
graph TB
    subgraph AppLayer["Application Layer"]
        GameAssets[Game Assets]
        UserData[User Data]
        Tournaments[Tournament Data]
        Backups[Game History Backups]
    end

    subgraph StorageLayer["0G Storage"]
        LogLayer[Log Layer<br/>Immutable Storage]
        KVLayer[Key-Value Layer<br/>Mutable Storage]
    end

    subgraph StorageNet["Storage Network"]
        Indexer[Indexer<br/>Node Selection]
        Nodes[Storage Nodes<br/>Erasure Coded]
    end

    GameAssets --> LogLayer
    Backups --> LogLayer
    UserData --> KVLayer
    Tournaments --> LogLayer

    LogLayer --> Indexer
    KVLayer --> Indexer
    
    Indexer --> Nodes
    
    style LogLayer fill:#50c878
    style KVLayer fill:#ff6b6b
    style StorageNet fill:#ffa500
```

## Complete Integration Flow

```mermaid
flowchart TD
    Start([User Action]) --> ActionType{Action Type}
    
    ActionType -->|Play Game| GameFlow[Game Flow]
    ActionType -->|Upload Asset| StorageFlow[Storage Flow]
    ActionType -->|Ask AI| ComputeFlow[Compute Flow]
    ActionType -->|View History| DAFlow[DA Flow]
    
    GameFlow --> Pyth[Get Randomness from Pyth]
    Pyth --> ProcessGame[Process Game Result]
    ProcessGame --> SaveDB[(Save to Database)]
    ProcessGame --> SaveDA[Submit to 0G DA]
    ProcessGame --> BackupStorage[Backup to 0G Storage]
    
    StorageFlow --> SelectNodes[Select Storage Nodes]
    SelectNodes --> Upload[Upload to 0G Storage]
    Upload --> Merkle[Generate Merkle Tree]
    Merkle --> OnChain[Submit to 0G Chain]
    
    ComputeFlow --> CheckBalance[Check Compute Balance]
    CheckBalance --> DiscoverProviders[Discover AI Providers]
    DiscoverProviders --> Acknowledge[Acknowledge Provider]
    Acknowledge --> Inference[Send Inference Request]
    Inference --> Pay[Process Payment]
    
    DAFlow --> GetBlob[Get Blob from DA]
    GetBlob --> Verify[Verify Merkle Proof]
    Verify --> Display[Display Data]
    
    SaveDB --> End([Complete])
    SaveDA --> End
    BackupStorage --> End
    OnChain --> End
    Pay --> End
    Display --> End

    style GameFlow fill:#e8f4f8
    style StorageFlow fill:#fff9e6
    style ComputeFlow fill:#f0f0f0
    style DAFlow fill:#ffe6e6
```

## File Structure

```
src/
├── config/
│   ├── ogComputeNetwork.js    # Compute config
│   ├── ogDA.js                 # DA config
│   └── ogStorage.js            # Storage config
├── services/
│   ├── OGDAService.js          # DA service
│   ├── OGStorageService.js     # Storage service
│   └── OGComputeNetworkService.js # Compute service (unused - API only)
├── hooks/
│   └── useOGComputeNetwork.js  # Compute hook
└── app/
    └── api/
        ├── og-compute/          # Compute API
        ├── og-da/               # DA API
        └── og-storage/          # Storage API
```

## Key Integration Points

### 1. 0G Chain
- **Purpose**: Primary blockchain for all transactions
- **Usage**: Treasury wallet operations, contract interactions
- **RPC**: `https://evmrpc-testnet.0g.ai`

### 2. 0G Compute Network
- **Purpose**: AI inference services
- **Usage**: AI Assistant chat feature
- **SDK**: `@0glabs/0g-serving-broker`
- **Providers**: GPT-OSS-120B, DeepSeek-R1-70B

### 3. 0G Data Availability
- **Purpose**: Immutable game history and audit trails
- **Usage**: Game result logging, batch submissions
- **Protocol**: gRPC with DA Client node
- **Max Blob Size**: 32 MB

### 4. 0G Storage
- **Purpose**: Decentralized file storage
- **Usage**: Game assets, user profiles, backups
- **SDK**: `@0glabs/0g-ts-sdk`
- **Layers**: Log Layer (immutable), KV Layer (mutable)
- **Max File Size**: 10 GB

## Environment Variables

```bash
# 0G Chain
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc-testnet.0g.ai
TREASURY_PRIVATE_KEY=your_private_key

# 0G Compute
NEXT_PUBLIC_0G_COMPUTE_NETWORK=testnet

# 0G DA
NEXT_PUBLIC_0G_DA_CLIENT_URL=http://localhost:51001

# 0G Storage
NEXT_PUBLIC_0G_STORAGE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_0G_FLOW_CONTRACT=0x...
NEXT_PUBLIC_0G_KV_CLIENT_ENDPOINT=http://...
```

---

**Last Updated**: November 2024  
**Version**: 1.0.0

