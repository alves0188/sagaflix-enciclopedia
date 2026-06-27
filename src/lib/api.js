import { supabase } from './supabaseClient';

export const api = {
  // --- Books ---
  async getBooksByAuthor(authorId) {
    const { data, error } = await supabase.from('books').select('*').eq('author_id', authorId);
    if (error) throw error;
    return data;
  },
  
  async getAllPublishedBooks() {
    const { data, error } = await supabase.from('books').select('*').in('status', ['FINISHED', 'published', 'finished']);
    if (error) throw error;
    return data;
  },

  async updateBook(bookId, updates) {
    const { data, error } = await supabase.from('books').update(updates).eq('id', bookId).select().single();
    if (error) throw error;
    return data;
  },

  async createBook(book) {
    const { data, error } = await supabase.from('books').insert(book).select().single();
    if (error) throw error;
    return data;
  },

  async deleteBook(bookId) {
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (error) throw error;
  },

  // --- Ideas ---
  async getBookIdeas(bookId, authorId = null) {
    let query = supabase.from('book_ideas').select('*').order('order_index', { ascending: true });
    if (bookId) {
      query = query.eq('book_id', bookId);
    } else if (authorId) {
      query = query.is('book_id', null).eq('author_id', authorId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async saveBookIdea(ideaOrIdeas) {
    // Upsert
    const { data, error } = await supabase.from('book_ideas').upsert(ideaOrIdeas).select();
    if (error) throw error;
    return data;
  },

  async deleteBookIdea(ideaId) {
    const { error } = await supabase.from('book_ideas').delete().eq('id', ideaId);
    if (error) throw error;
  },

  // --- Escaleta ---
  async getBookEscaleta(bookId) {
    const { data, error } = await supabase.from('book_escaleta').select('*').eq('book_id', bookId).order('act', { ascending: true }).order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  },

  async saveEscaletaItem(item) {
    const { data, error } = await supabase.from('book_escaleta').upsert(item).select().single();
    if (error) throw error;
    return data;
  },

  async deleteEscaletaItem(itemId) {
    const { error } = await supabase.from('book_escaleta').delete().eq('id', itemId);
    if (error) throw error;
  },

  // --- Universe Items (Dossier) ---
  async getUniverseItems(bookId) {
    const { data, error } = await supabase.from('universe_items').select('*').eq('book_id', bookId);
    if (error) throw error;
    return data;
  },

  async saveUniverseItem(item) {
    const { data, error } = await supabase.from('universe_items').upsert(item).select().single();
    if (error) throw error;
    return data;
  },

  async deleteUniverseItem(itemId) {
    const { error } = await supabase.from('universe_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  // --- Universe Connections ---
  async getUniverseConnections(itemIds) {
    if (!itemIds || itemIds.length === 0) return [];
    const { data, error } = await supabase.from('universe_connections').select('*').in('item_id', itemIds);
    if (error) throw error;
    return data;
  },

  async saveUniverseConnection(connection) {
    const { data, error } = await supabase.from('universe_connections').upsert(connection).select().single();
    if (error) throw error;
    return data;
  },

  async deleteUniverseConnection(connectionId) {
    const { error } = await supabase.from('universe_connections').delete().eq('id', connectionId);
    if (error) throw error;
  },

  // --- Support Tickets / Inbox ---
  async getTicketsForAuthor(authorId) {
    const { data, error } = await supabase.from('support_tickets').select('*').eq('author_id', authorId);
    if (error) throw error;
    return data;
  },

  async saveTicket(ticket) {
    const { data, error } = await supabase.from('support_tickets').upsert(ticket).select().single();
    if (error) throw error;
    return data;
  }
};
