import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import SimpleReactValidator from 'simple-react-validator';
import swal from 'sweetalert';
import Global from '../Global';
import Sidebar from './Sidebar';
import ImageDefault from '../assets/images/default.png';

// 1. Recoger el id del articulo a editar de la url
// 2. Crear un metodo para sacar ese objeto del backend
// 3. Rellenar el formulario con esos datos
// 4. Actualizar el objeto haciendo una petición al backend

class EditArticle extends Component {
  url = Global.url;

  articleId = null;

  titleRef = React.createRef();
  contentRef = React.createRef();

  state = {
    article: {},
    status: null,
    selectedFile: null,
  };

  componentWillMount() {
    this.articleId = this.props.match.params.id; // aca el id del articulo a editar
    this.getArticle(this.articleId); // ya tengo el articulo en el state

    this.validator = new SimpleReactValidator({
      messages: {
        required: 'Este campo es requerido',
      },
    }); /* en esta propiedad esta cargado el validator */
  }

  getArticle = (id) => {
    // pasando el id del articulo para sacar
    axios.get(this.url + '/article/' + id).then((res) => {
      this.setState({
        article: res.data.article,
      });
    });
  };

  changeState = () => {
    this.setState({
      article: {
        title: this.titleRef.current.value,
        content: this.contentRef.current.value,
        image: this.state.article.image,
      },
    });

    this.validator.showMessages(); /* se esta evaluando en el momento con el evento onchange */
    this.forceUpdate();
  };

  saveArticle = (e) => {
    e.preventDefault();

    // Rellenar state con formulario
    this.changeState();

    if (this.validator.allValid()) {
      // Hacer una petición http por put para actualizar el articulo
      axios
        .put(
          this.url + '/article/' + this.articleId,
          this.state.article
        ) /* este es el objeto que se encuentra en el state y se guarda en la base de datos */
        .then((res) => {
          if (res.data.article) {
            this.setState({
              article: res.data.article /* guardando el articulo en la base de datos */,
              status: 'waiting',
            });

            swal('Articulo editado', 'El articulo ha sido editado correctamente', 'success');

            // Subir la imagen
            if (this.state.selectedFile !== null) {
              /* si es diferente a null, subir el archivo a la base de datos */

              // Sacar el id del articulo guardado
              var articleId = this.state.article._id;

              // Crear form data y añadir fichero
              const formData = new FormData(); /* peticion para adjuntarle un archivo */

              formData.append(/* metodo append vincularle un fichero */ 'file0', this.state.selectedFile, this.state.selectedFile.name);

              // Peticion ajax
              axios.post(this.url + '/upload-image/' + articleId, formData).then((res) => {
                if (res.data.article) {
                  this.setState({
                    article: res.data.article /* guardando el articulo en la base de datos */,
                    status: 'success',
                  });
                } else {
                  this.setState({
                    article: res.data.article /* guardando el articulo en la base de datos */,
                    status: 'failed',
                  });
                }
              });
            } else {
              this.setState({
                status: 'success',
              });
            }
          } else {
            this.setState({
              status: 'failed' /* en caso de error actualizar el status */,
            });
          }
        });
    } else {
      this.setState({
        status: 'failed',
      });

      this.validator.showMessages();
      this.forceUpdate();
    }
  };

  fileChange = (event) => {
    this.setState({
      selectedFile: event.target.files[0],
    });
  };

  render() {
    if (this.state.status === 'success') {
      return <Redirect to='/blog' />; /* cuando se guarde el articulo y sea correcto redirige al blog */
    }

    let article = this.state.article;
    return (
      <div className='center'>
        <section id='content'>
          <h1 className='subheader'>Editar articulo</h1>

          {this.state.article.title && (
            <form className='mid-form' onSubmit={this.saveArticle}>
              {/* metodo que se llama cuando se enviar el form */}
              <div className='form-group'>
                <label htmlFor='title'>Titulo</label>
                <input type='text' name='title' defaultValue={article.title} ref={this.titleRef} onChange={this.changeState} />
                {/* validacion */}
                {this.validator.message('title', this.state.article.title, 'required|alpha')}{' '}
                {/* 3 parametros del message. // alphanumericos */}
              </div>
              <div className='form-group'>
                <label htmlFor='content'>Contenido</label>
                <textarea name='content' defaultValue={article.content} ref={this.contentRef} onChange={this.changeState}></textarea>

                {this.validator.message('content', this.state.article.content, 'required')}
              </div>
              <div className='form-group'>
                <label htmlFor='file0'>Imagen</label>

                <input type='file' name='file0' onChange={this.fileChange} />

                <div className='image-wrap'>
                  {article.image != null /* si es diferente a null entonces se va a mostrar la imagen */ ? (
                    <img src={this.url + '/get-image/' + article.image} alt={article.title} />
                  ) : (
                    <img src={ImageDefault} alt={article.title} className='thumb' />
                  )}
                </div>
              </div>
              <div className='clearfix'></div>
              <input type='submit' value='Guardar' className='btn btn-success' />
            </form>
          )}

          {!this.state.article.title && <h1 className='subheader'>Cargando...</h1>}
        </section>

        <Sidebar />
      </div>
    );
  }
}

export default EditArticle;
