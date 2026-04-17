import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  role: 'user' | 'assistant';

  @Column('text')
  content: string;

  @Column({ type: 'boolean', default: false })
  hasImage: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
