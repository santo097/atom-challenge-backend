import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { User } from '@domain/entities';
import type { UserRepository } from '@domain/repositories';

interface UserDoc {
  email: string;
  createdAt: Timestamp;
}

/**
 * Adaptador Firestore del UserRepository.
 *
 * Colección: `users` (document id == user id generado por la app).
 * El email se almacena normalizado (lowercase) para permitir búsqueda
 * con `where('email', '==', ...)` — Firestore no soporta búsquedas
 * case-insensitive nativas.
 */
export class FirestoreUserRepository implements UserRepository {
  private static readonly COLLECTION = 'users';

  constructor(private readonly db: Firestore) {}

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.db
      .collection(FirestoreUserRepository.COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    if (!doc) return null;
    return this.hydrate(doc.id, doc.data() as UserDoc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.db.collection(FirestoreUserRepository.COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return this.hydrate(doc.id, doc.data() as UserDoc);
  }

  async save(user: User): Promise<User> {
    const data: UserDoc = {
      email: user.email,
      createdAt: Timestamp.fromDate(user.createdAt),
    };
    await this.db.collection(FirestoreUserRepository.COLLECTION).doc(user.id).set(data);
    return user;
  }

  private hydrate(id: string, data: UserDoc): User {
    return User.fromPersistence({
      id,
      email: data.email,
      createdAt: data.createdAt.toDate(),
    });
  }
}
