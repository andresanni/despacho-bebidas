export type CreateEntity <T, K extends keyof T> = Omit<T, K>;
export type UpdateEntity<T, K extends keyof T> = Partial<Omit<T, K>>;