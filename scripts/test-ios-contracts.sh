#!/bin/bash
# Run the actual Swift DTO/SwiftData regression tests on macOS without an iOS simulator.
set -euo pipefail
cd "$(dirname "$0")/.."
build_dir=$(mktemp -d "${TMPDIR:-/tmp}/bgt-contracts.XXXXXX")
trap 'rm -rf "$build_dir"' EXIT
swiftc -D CONTRACT_TEST_RUNNER -parse-as-library -swift-version 6 \
  -module-cache-path "$build_dir/cache" \
  BoardGameTools/BoardGameTools/Networking/*.swift \
  BoardGameTools/BoardGameTools/Security/KeychainManager.swift \
  BoardGameTools/BoardGameTools/Utilities/JSON+ISO8601.swift \
  BoardGameTools/BoardGameTools/Services/AuthManager.swift \
  BoardGameTools/BoardGameTools/Services/SyncEngine.swift \
  BoardGameTools/BoardGameTools/Data/LocalDataSource.swift \
  BoardGameTools/BoardGameTools/Data/RemoteDataSource.swift \
  BoardGameTools/BoardGameTools/Models/*.swift \
  BoardGameTools/BoardGameTools/Data/PersistenceController.swift \
  BoardGameTools/BoardGameToolsTests/BoardGameToolsTests.swift \
  -o "$build_dir/contracts"
"$build_dir/contracts"
