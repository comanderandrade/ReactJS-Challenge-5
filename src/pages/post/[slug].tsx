import Link from 'next/link';
import Head from 'next/head';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import ptBr from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';

import { PostInfo } from '../../components/PostInfo';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import commonStyles from '../../styles/common.module.scss';
import { Comments } from '../../components/Comments';
interface Post {
  uid: string,
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  wasEdited: boolean,
  prevPost: Post | undefined,
  nextPost: Post | undefined
}

export default function Post({ post, wasEdited, prevPost, nextPost }: PostProps) {
  const router = useRouter();

  const readTime = post.data.content.reduce((acc, content) => {
    const contentReadTime = RichText.asText(content.body).split(' ').length;
    return Math.ceil(acc + contentReadTime / 200);
  }, 0);

  return (
    <>
      {router.isFallback ? <p>Carregando...</p>
        : <>
          <Head>
            <title>{post.data.title} | Spacetraveling</title>
          </Head>
          <main className={styles.post}>
            <div className={styles.bannerContainer}>
              <img src={post.data.banner.url} alt={post.data.title} />
            </div>

            <div className={commonStyles.container}>
              <div className={commonStyles.content}>
                <h1>{post.data.title}</h1>

                <PostInfo
                  publicationDate={post.first_publication_date}
                  author={post.data.author}
                  readTime={`${readTime} min`}
                />

                {wasEdited && <section className={styles.postWasEdited}>
                  <span>* editado em{' '}{
                    format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                      locale: ptBr
                    })}</span>
                </section>}

                <div className={styles.postContent}>
                  {post.data.content.map(content => (
                    <article key={content.heading}>
                      <strong>{content?.heading}</strong>
                      {content.body.map((body, index) => {
                        return <p key={index}>{body.text}</p>
                      })}
                    </article>
                  ))}
                </div>

                <section className={styles.actions}>
                  {prevPost && <div>
                    <div className={`${styles.action} ${styles.prevAction}`}>
                      <span>{prevPost.data.title}</span>
                      <Link href={`/post/${prevPost.uid}`}>
                        <a>
                          Post anterior
                        </a>
                      </Link>
                    </div>
                  </div>}

                  {nextPost && <div>
                    <div className={`${styles.action} ${styles.nextAction}`}>
                      <span>{nextPost.data.title}</span>
                      <Link href={`/post/${nextPost.uid}`}>
                        <a>
                          Próximo post
                        </a>
                      </Link>
                    </div>
                  </div>}
                </section>

                <Comments />
              </div>
            </div>
          </main>
        </>
      }
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { fetch: ['post.title', 'post.subtitle', 'post.author'] }
  );

  const slugs = posts.results.map((post => post.uid));

  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const wasEdited = response.last_publication_date > response.first_publication_date;

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]'
    }
  );

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]'
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body.map(body => ({
          text: body.text,
          type: body.type,
          spans: [...body.spans]
        })),
      }))

    },
  };

  return {
    props: {
      post,
      wasEdited,
      prevPost: prevPost?.results[0] || null,
      nextPost: nextPost?.results[0] || null
    },
    revalidate: 3600, // 1 hour
  }
};
