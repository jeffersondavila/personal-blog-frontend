/**
 * Tarjeta de proyecto en un listado (USER_FLOWS A.7): titulo, resumen,
 * tecnologias, estado del trabajo y enlaces a repositorio y demo.
 */
import { Link } from 'react-router';

import { ProjectStatusBadge } from './ProjectStatusBadge';
import { Badge, Card, ExternalLink } from '../../components';
import { RUTAS, rutaDeContenido } from '../../lib/rutas';
import type { ProyectoDeListado } from '../../services/public/types';
import { PublishedDate } from '../content/PublishedDate';
import styles from '../content/tarjeta.module.css';
import { MediaImage } from '../media/MediaImage';
import { TagLinks } from '../tags/TagLinks';

export interface ProjectCardProps {
  readonly proyecto: ProyectoDeListado;
  readonly nivelDeTitulo?: 2 | 3;
}

export function ProjectCard({ proyecto, nivelDeTitulo = 2 }: ProjectCardProps) {
  const Titulo = nivelDeTitulo === 3 ? 'h3' : 'h2';

  return (
    <li className={styles['item']}>
      <Card className={styles['tarjeta']}>
        <article className={styles['articulo']}>
          <MediaImage medio={proyecto.cover} className={styles['imagen']} />
          <Titulo className={styles['titulo']}>
            <Link to={rutaDeContenido('project', proyecto.slug)}>{proyecto.title}</Link>
          </Titulo>
          <div className={styles['meta']}>
            <ProjectStatusBadge estado={proyecto.project_status} />
            <PublishedDate fecha={proyecto.published_at} />
          </div>
          {proyecto.summary !== null && <p className={styles['resumen']}>{proyecto.summary}</p>}
          {proyecto.technologies.length > 0 && (
            <ul className={styles['acciones']} aria-label="Tecnologías">
              {proyecto.technologies.map((tecnologia) => (
                <li key={tecnologia}>
                  <Badge>{tecnologia}</Badge>
                </li>
              ))}
            </ul>
          )}
          <div className={[styles['acciones'], styles['pie']].join(' ')}>
            {proyecto.repository_url !== null && (
              <ExternalLink href={proyecto.repository_url}>Repositorio</ExternalLink>
            )}
            {proyecto.demo_url !== null && (
              <ExternalLink href={proyecto.demo_url}>Demo</ExternalLink>
            )}
          </div>
          <TagLinks seccion={RUTAS.proyectos} tags={proyecto.tags} />
        </article>
      </Card>
    </li>
  );
}
