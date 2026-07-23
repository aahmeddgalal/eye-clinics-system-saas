import { supabase } from './supabase';

/**
 * Generic Database Helper Functions
 * These functions provide a simplified API for basic CRUD operations across any table.
 */

export const db = {
  /**
   * Fetch all records from a table
   * @param {string} table - Table name
   * @param {string} select - Columns to select (default '*')
   */
  async getAll(table, select = '*') {
    const { data, error } = await supabase.from(table).select(select);
    if (error) {
      console.error(`Error fetching from ${table}:`, error.message);
      return { data: null, error };
    }
    return { data, error: null };
  },

  /**
   * Fetch a single record by ID
   * @param {string} table - Table name
   * @param {string} id - Record UUID
   */
  async getById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error(`Error fetching ${table} by id:`, error.message);
      return { data: null, error };
    }
    return { data, error: null };
  },

  /**
   * Insert a new record
   * @param {string} table - Table name
   * @param {object} payload - Data object to insert
   */
  async insert(table, payload) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error(`Error inserting into ${table}:`, error.message);
      return { data: null, error };
    }
    return { data, error: null };
  },

  /**
   * Update an existing record
   * @param {string} table - Table name
   * @param {string} id - Record UUID
   * @param {object} payload - Data object with updated fields
   */
  async update(table, id, payload) {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error(`Error updating ${table}:`, error.message);
      return { data: null, error };
    }
    return { data, error: null };
  },

  /**
   * Delete a record by ID
   * @param {string} table - Table name
   * @param {string} id - Record UUID
   */
  async remove(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`Error deleting from ${table}:`, error.message);
      return { error };
    }
    return { error: null };
  }
};
