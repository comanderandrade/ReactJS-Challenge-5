import { format } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';

interface PostInfoProps {
  publicationDate: string,
  author: string,
  readTime?: string
}

export function PostInfo({ publicationDate, author, readTime }: PostInfoProps) {
  return (
    <div className={commonStyles.postInfo}>
      <div>
        <FiCalendar color='#BBBBBB' />
        <time>
          {format(new Date(publicationDate), 'dd MMM yyyy', {
            locale: ptBr
          })}
        </time>
      </div>

      <div>
        <FiUser color='#BBBBBB' />
        <span>{author}</span>
      </div>

      {readTime && <div>
        <FiClock color='#BBBBBB' />
        <span>{readTime}</span>
      </div>}
    </div>
  );
}