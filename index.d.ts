import { EventEmitter } from 'events'

declare namespace lmdb {
	export function open<V = any, K extends Key = Key>(path: string, options: RootDatabaseOptions): RootDatabase<V, K>
	export function open<V = any, K extends Key = Key>(options: RootDatabaseOptionsWithPath): RootDatabase<V, K>

	class Database<V = any, K extends Key = Key> extends EventEmitter {
		/**
		* Get the value stored by given id/key
		* @param id The key for the entry
		**/
		get(id: K): V | undefined
		/**
		* Get the entry stored by given id/key, which includes both the value and the version number (if available)
		* @param id The key for the entry
		**/
		getEntry(id: K): {
			value: V | undefined
			version?: number
		}
		/**
		* Store the provided value, using the provided id/key
		* @param id The key for the entry
		* @param value The value to store
		**/
		put(id: K, value: V): Promise<boolean>
		/**
		* Store the provided value, using the provided id/key and version number, and optionally the required
		* existing version
		* @param id The key for the entry
		* @param value The value to store
		* @param version The version number to assign to this entry
		* @param ifVersion If provided the put will only succeed if the previous version number matches this (atomically checked)
		**/
		put(id: K, value: V, version: number, ifVersion?: number): Promise<boolean>
		/**
		* Remove the entry with the provided id/key
		* existing version
		* @param id The key for the entry to remove
		**/
		remove(id: K): Promise<boolean>
		/**
		* Remove the entry with the provided id/key, conditionally based on the provided existing version number
		* existing version
		* @param id The key for the entry to remove
		* @param ifVersion If provided the remove will only succeed if the previous version number matches this (atomically checked)
		**/
		remove(id: K, ifVersion: number): Promise<boolean>
		/**
		* Remove the entry with the provided id/key and value (mainly used for dupsort databases)
		* existing version
		* @param id The key for the entry to remove
		* @param valueToRemove The value for the entry to remove
		**/
		remove(id: K, valueToRemove: V): Promise<boolean>
		/**
		* Syncronously store the provided value, using the provided id/key, will return after the data has been written.
		* @param id The key for the entry
		* @param value The value to store
		**/
		putSync(id: K, value: V): void
		/**
		* Syncronously store the provided value, using the provided id/key and version number
		* existing version
		* @param id The key for the entry
		* @param value The value to store
		* @param version The version number to assign to this entry
		**/
		putSync(id: K, value: V, version: number): void
		/**
		* Syncronously remove the entry with the provided id/key
		* existing version
		* @param id The key for the entry to remove
		**/
		removeSync(id: K): boolean
		/**
		* Synchronously remove the entry with the provided id/key and value (mainly used for dupsort databases)
		* existing version
		* @param id The key for the entry to remove
		* @param valueToRemove The value for the entry to remove
		**/
		removeSync(id: K, valueToRemove: V): boolean
		/**
		* Get all the values for the given key (for dupsort databases)
		* existing version
		* @param key The key for the entry to remove
		* @param options The options for the iterator
		**/
		getValues(key: K, options?: RangeOptions): ArrayLikeIterable<V>
		/**
		* Get all the keys for the given range
		* existing version
		* @param options The options for the range/iterator
		**/
		getKeys(options: RangeOptions): ArrayLikeIterable<K>
		/**
		* Get all the entries for the given range
		* existing version
		* @param options The options for the range/iterator
		**/
		getRange(options: RangeOptions): ArrayLikeIterable<{ key: K, value: V, version?: number }>
		/**
		* Execute a transaction syncronously, running all the actions within the action callback in the transaction,
		* and committing the transaction after the action callback completes.
		* existing version
		* @param action The function to execute within the transaction
		* @param abort If true will abort the transaction when completed
		**/
		transaction<T>(action: () => T, abort?: boolean): T
		/**
		* Execute writes actions that are all conditionally dependent on the entry with the provided key having the provided
		* version number (checked atomically).
		* @param id Key of the entry to check
		* @param ifVersion The require version number of the entry for all actions to succeed
		* @param action The function to execute with actions that will be dependent on this condition
		**/
		ifVersion(id: K, ifVersion: number, action: () => any): Promise<boolean>
		/**
		* Execute writes actions that are all conditionally dependent on the entry with the provided key
		* not existing (checked atomically).
		* @param id Key of the entry to check
		* @param action The function to execute with actions that will be dependent on this condition
		**/
		ifNoExists(id: K, action: () => any): Promise<boolean>
		/**
		* Delete this database/store.
		**/
		deleteDB(): void
		/**
		* Clear all the entries from this database/store.
		**/
		clear(): void
		/**
		* Check the reader locks and remove any stale reader locks. Returns the number of stale locks that were removed.
		**/
		readerCheck(): number
		/**
		* Returns a string that describes all the current reader locks, useful for debugging if reader locks aren't being removed.
		**/
		readerList(): string
		/**
		* Returns statistics about the current database
		**/
		getStats(): {}
		/**
		* Make a snapshot copy of the current database at the indicated path.
		**/
		backup(path: string, compact: boolean): Promise<void>
		/**
		* Close the current database.
		**/
		close(): void
	}
	class RootDatabase<V = any, K extends Key = Key> extends Database<V, K> {
		/**
		* Open a database store using the provided options.
		**/
		openDB(options: DatabaseOptions & { name: string }): Database<V, K>
		/**
		* Open a database store using the provided options.
		**/
		openDB(dbName: string, dbOptions: DatabaseOptions): Database<V, K>
	}

	type Key = Key[] | string | symbol | number | boolean | Buffer;

	interface DatabaseOptions {
		name?: string
		cache?: boolean
		compression?: boolean | CompressionOptions
		encoding?: 'msgpack' | 'json' | 'string' | 'binary'
		sharedStructuresKey?: Key
		useVersions?: boolean
		keyIsBuffer?: boolean
		keyIsUint32?: boolean
	}
	interface RootDatabaseOptions extends DatabaseOptions {
		/** The maximum number of databases to be able to open (there is some extra overhead if this is set very high).*/
		maxDbs?: number
		/** Set a longer delay (in milliseconds) to wait longer before committing writes to increase the number of writes per transaction (higher latency, but more efficient) **/
		commitDelay?: number
		immediateBatchThreshold?: number
		syncBatchThreshold?: number
		/** This provides a small performance boost (when not using useWritemap) for writes, by skipping zero'ing out malloc'ed data, but can leave application data in unused portions of the database. This is recommended unless there are concerns of database files being accessible. */
		noMemInit?: boolean
		/** Use writemaps, this improves performance by reducing malloc calls, but it is possible for a stray pointer to corrupt data. */
		useWritemap?: boolean
		noSubdir?: boolean
		noSync?: boolean
		noMetaSync?: boolean
		readOnly?: boolean
		mapAsync?: boolean
		maxReaders?: number
	}
	interface RootDatabaseOptionsWithPath extends RootDatabaseOptions {
		path: string
	}
	interface CompressionOptions {
		threshold?: number
		dictionary?: Buffer
	}
	interface RangeOptions {
		/** Starting key for a range **/
		start?: Key
		/** Ending key for a range **/
		end?: Key
		/** Iterate through the entries in reverse order **/
		reverse?: boolean
		/** Include version numbers in each entry returned **/
		versions?: boolean
		/** The maximum number of entries to return **/
		limit?: number
		/** The number of entries to skip **/
		offset?: number
		/** Use a snapshot of the database from when the iterator started **/
		snapshot?: boolean
	}
	class ArrayLikeIterable<T> implements Iterable<T> {
		map<U>(callback: (entry: T) => U): ArrayLikeIterable<U>
		filter(callback: (entry: T) => any): ArrayLikeIterable<T>
		[Symbol.iterator]() : Iterator<T>
		forEach(callback: (entry: T) => any): void
		asArray: T[]
	}
	export function getLastVersion(): number
	export function compareKey(a: Key, b: Key): number
}
export = lmdb
