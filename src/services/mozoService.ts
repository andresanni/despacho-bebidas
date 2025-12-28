import { createCrudService } from './baseCrudService';
import type {
  Mozo,
  MozoCreate,
  MozoUpdate
} from '../types/models';
import { supabase } from '../utils/supabase';

const baseMozoService = createCrudService<Mozo, MozoCreate, MozoUpdate>({
    table: 'mozo',
    idColumn: 'id_mozo',
    orderBy: 'nombre'
})

export const mozoService = {
    ...baseMozoService,
    softDelete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('mozo')
      .update({ activo: false })
      .eq('id_mozo', id);

    if (error) {
      console.error('Error soft deleting mozo:', error);
      throw error;
    }
  }
}
