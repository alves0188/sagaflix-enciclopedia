import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SUPABASE_URL = 'https://guecsoghyqvssdvednnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YWwu5Pu5JcVoDJ0fwiZn8A_vQfwaHN3';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function patchUniverseItems() {
    console.log("Starting Universe Items Migration Patch...");

    const { data: dbData, error: dbError } = await supabase.from('sagaflix_db').select('data').eq('id', 1).single();
    if (dbError) throw dbError;
    const oldDb = dbData.data;

    for (const book of oldDb.books) {
        if (!book.universe) continue;
        
        for (const type of ['characters', 'locations', 'organizations', 'items']) {
            const items = book.universe[type] || [];
            if (items.length > 0) {
                console.log(`Patching ${items.length} ${type} for book ${book.title}...`);
                for (const item of items) {
                    const updateData = {
                        status: item.status || 'draft',
                        gallery: item.gallery || [],
                        custom_fields: item.customFields || [],
                        private_notes: item.privateNotes || ''
                    };
                    const { error } = await supabase.from('universe_items').update(updateData).eq('id', item.id);
                    if (error) {
                        console.error(`Error patching ${item.id}:`, error);
                    }
                }
            }
        }
    }
    
    console.log("Migration patch completed!");
}

patchUniverseItems().catch(console.error);
