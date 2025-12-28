import { supabase } from "../utils/supabase";

export function createCrudService<Entity, CreateDTO, UpdateDTO> (config: {
 table: string;
 idColumn: string;
 orderBy?: string;
}) {
    const { table, idColumn, orderBy } = config;
    return{
        getAll: async () : Promise<Entity[]> => {
            let query = supabase.from(table).select('*');
            if (orderBy) {
                query = query.order(orderBy);
            }
            const { data, error } = await query;
            if (error) {
                console.error(`Error fetching ${table}:`, error);
                throw error;
            }
            return data ?? [];
        },

        create: async (payload: CreateDTO) : Promise<Entity> => {
            const { data, error } = await supabase.from(table).insert([payload]).select().single();
            if (error) {
                console.error(`Error creating ${table}:`, error);
                throw error;
            }
            return data;
        },

        update: async(id: number, payload: UpdateDTO): Promise<Entity> => {
            const {data, error} = await supabase.from(table).update(payload).eq(idColumn, id).select().single();

            if(error){
                console.error(`Error updating ${table}:`, error);
                throw error;
            }
            return data;
        },
        
    }
}