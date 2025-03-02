import { PGlite, Transaction } from "@electric-sql/pglite";
import { Mod } from "./mod_types";
import { AsyncDataResourceLoader } from "./resource_loader";
import { mod_data, setModData } from "./mod_search_logic";

const USE_LOCAL_LOADER = false;
const db = USE_LOCAL_LOADER ? new PGlite("idb://fibermc") : undefined;

// Process large data sets without freezing the UI
async function processBatchesNonBlocking(mod_data: Mod[]) {
    if (!db) {
        return;
    }
    const BATCH_SIZE = 500;
    const totalBatches = Math.ceil(mod_data.length / BATCH_SIZE);

    // Create a promise that will resolve when all processing is complete
    return new Promise<void>(async (resolve, reject) => {
        try {
            // Use transaction for the entire operation
            await db.transaction(async (tx) => {
                let batchIndex = 0;

                // Process one batch at a time with UI updates in between
                async function processNextBatch() {
                    if (batchIndex >= mod_data.length) {
                        // All batches processed
                        resolve();
                        return;
                    }

                    // Schedule UI update before processing
                    await new Promise<void>((requestAnimationFrameResolve) => {
                        requestAnimationFrame(() => {
                            requestAnimationFrameResolve();
                        });
                    });

                    // Get the current batch
                    const batch = mod_data.slice(
                        batchIndex,
                        batchIndex + BATCH_SIZE
                    );

                    await new Promise<void>((microtaskResolve) => {
                        queueMicrotask(async () => {
                            try {
                                console.log(
                                    `Processing batch ${
                                        Math.floor(batchIndex / BATCH_SIZE) + 1
                                    } of ${totalBatches}`
                                );

                                await processSingleBatch(tx, batch);
                                batchIndex += BATCH_SIZE;
                                microtaskResolve();
                            } catch (error) {
                                reject(error);
                            }
                        });
                    });

                    // Schedule the next batch processing
                    await processNextBatch();
                }

                // Start processing batches
                await processNextBatch();
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to process a single batch of data
async function processSingleBatch(tx: Transaction, batch: Mod[]) {
    // Create a large multi-value INSERT statement
    let valuesSql = [];
    let params = [];
    let paramIndex = 1;

    for (const mod of batch) {
        // Add placeholders for this row
        valuesSql.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 
        $${paramIndex++}::INT4[], $${paramIndex++}::jsonb, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 
        $${paramIndex++}::text[], $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 
        $${paramIndex++})`);

        // Add values to params array
        params.push(
            mod.id,
            mod.name,
            mod.mr_slug,
            mod.cf_slug,
            mod.summary,
            mod.categories,
            JSON.stringify(mod.authors),
            mod.dateReleased,
            mod.dateModified,
            mod.downloadCount,
            mod.mc_versions,
            mod.s_name,
            mod.s_latestMCVersion,
            mod.s_dateModified,
            mod.latestMCVersion,
            mod.s_author
        );
    }

    // Build the complete query with all batch values
    const query = `
        INSERT INTO mod_data (
          id, name, mr_slug, cf_slug, summary, categories, authors,
          date_released, date_modified, download_count, mc_versions,
          s_name, s_latest_mc_version, s_date_modified, latest_mc_version, s_author
        )
        VALUES ${valuesSql.join(",")}
        ON CONFLICT (id) 
        DO UPDATE SET
          name = EXCLUDED.name,
          mr_slug = EXCLUDED.mr_slug,
          cf_slug = EXCLUDED.cf_slug,
          summary = EXCLUDED.summary,
          categories = EXCLUDED.categories,
          authors = EXCLUDED.authors,
          date_released = EXCLUDED.date_released,
          date_modified = EXCLUDED.date_modified,
          download_count = EXCLUDED.download_count,
          mc_versions = EXCLUDED.mc_versions,
          s_name = EXCLUDED.s_name,
          s_latest_mc_version = EXCLUDED.s_latest_mc_version,
          s_date_modified = EXCLUDED.s_date_modified,
          latest_mc_version = EXCLUDED.latest_mc_version,
          s_author = EXCLUDED.s_author
    `;

    // Execute the query within the transaction
    await tx.query(query, params);
}

export async function updateDatabase(mod_data: Mod[]) {
    if (!db) {
        return;
    }
    try {
        setLoadingState(true);
        await db.exec(`
            CREATE TABLE IF NOT EXISTS mod_data (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                mr_slug TEXT,
                cf_slug TEXT,
                summary TEXT,
                categories INT4[], -- Text array for categories
                authors JSONB,     -- JSONB for authors
                date_released TIMESTAMP,
                date_modified TIMESTAMP,
                download_count BIGINT,
                mc_versions TEXT[], -- Text array for versions
                s_name TEXT,
                s_latest_mc_version NUMERIC,
                s_date_modified BIGINT,
                latest_mc_version TEXT,
                s_author TEXT
            );
        `);

        await processBatchesNonBlocking(mod_data);
    } catch (error) {
        console.error("Error updating database:", error);
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading: boolean) {
    const loadingElement = document.getElementById("loading-indicator");
    if (loadingElement) {
        loadingElement.style.display = isLoading ? "block" : "none";
    }
}

export async function getDbModData(db: PGlite, count: number): Promise<Mod[]> {
    const temp_mod_data = await db.query(
        `SELECT
            id,
            name,
            mr_slug,
            cf_slug,
            summary,
            categories,
            authors,
            date_released as "dateReleased",
            date_modified as "dateModified",
            download_count as "downloadCount",
            mc_versions,
            s_name,
            s_latest_mc_version as "s_latestMCVersion"
        FROM mod_data ORDER BY download_count DESC LIMIT ${count};
        `
    );
    return temp_mod_data.rows as Mod[];
}

export function createLocalLoader(logtime: (msg: string) => void) {
    return new AsyncDataResourceLoader({
        completionWaitForDCL: true,
    }).addResourceFn<Mod[] | undefined>(async () => {
        logtime("Start local db query");
        if (!db) {
            return undefined;
        }
        console.log("HAVE DB");
        await db.waitReady;
        logtime("Database Ready!");

        const temp_mod_data = await getDbModData(db, 100);
        logtime("Start local db query...done!");

        return temp_mod_data;
    }, [
        async (temp_mod_data) => {
            if (!temp_mod_data) {
                return;
            }
            console.log("SET ROWS", temp_mod_data);

            setModData(temp_mod_data);
            mod_data.sort((a, b) => b.downloadCount - a.downloadCount);
        },
    ]);
}
