import { useTranslation } from 'react-i18next'
import { config as toolsConfig } from '../../content-script/selection-tools/index.mjs'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { defaultConfig } from '../../config/index.mjs'
import { PencilIcon, TrashIcon } from '@primer/octicons-react'

SelectionTools.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

const defaultTool = {
  name: '',
  iconKey: 'explain',
  prompt: 'Explain this: {{selection}}',
  active: true,
}

export function SelectionTools({ config, updateConfig }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [editingTool, setEditingTool] = useState(defaultTool)
  const [editingIndex, setEditingIndex] = useState(-1)

  const editingComponent = (
    <div style={{ display: 'flex', flexDirection: 'column', '--spacing': '4px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={(e) => {
            e.preventDefault()
            setEditing(false)
          }}
        >
          {t('Cancel')}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            if (!editingTool.name) {
              setErrorMessage(t('Name is required'))
              return
            }
            if (!editingTool.prompt.includes('{{selection}}')) {
              setErrorMessage(t('Prompt template should include {{selection}}'))
              return
            }
            if (editingIndex === -1 && !editingTool.isDefaultOverride) {
              // New custom tool
              updateConfig({
                customSelectionTools: [...config.customSelectionTools, editingTool],
              })
            } else if (editingTool.isDefaultOverride) {
              // Editing a default tool override
              const overrides = { ...config.selectionToolsOverrides }
              overrides[editingTool.key] = {
                name: editingTool.name,
                iconKey: editingTool.iconKey,
                prompt: editingTool.prompt,
              }
              updateConfig({ selectionToolsOverrides: overrides })
            } else {
              // Editing an existing custom tool
              const customSelectionTools = [...config.customSelectionTools]
              customSelectionTools[editingIndex] = editingTool
              updateConfig({ customSelectionTools })
            }
            setEditing(false)
          }}
        >
          {t('Save')}
        </button>
      </div>
      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', whiteSpace: 'noWrap' }}>
        {t('Name')}
        <input
          type="text"
          value={editingTool.name}
          onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
        />
        {t('Icon')}
        <select
          value={editingTool.iconKey}
          onChange={(e) => setEditingTool({ ...editingTool, iconKey: e.target.value })}
        >
          {defaultConfig.selectionTools.map((key) => (
            <option key={key} value={key}>
              {t(toolsConfig[key].label)}
            </option>
          ))}
        </select>
      </div>
      {t('Prompt Template')}
      <textarea
        type="text"
        placeholder={t('Explain this: {{selection}}')}
        style={{
          resize: 'vertical',
          minHeight: '80px',
        }}
        value={editingTool.prompt}
        onChange={(e) => setEditingTool({ ...editingTool, prompt: e.target.value })}
      />
    </div>
  )

  return (
    <>
      {config.selectionTools.map((key) => {
        const override = config.selectionToolsOverrides?.[key]
        const label = override ? override.name : t(toolsConfig[key].label)
        return (
          <label key={key} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={config.activeSelectionTools.includes(key)}
              onChange={(e) => {
                const checked = e.target.checked
                const activeSelectionTools = config.activeSelectionTools.filter((i) => i !== key)
                if (checked) activeSelectionTools.push(key)
                updateConfig({ activeSelectionTools })
              }}
            />
            {label}
            <div style={{ flexGrow: 1 }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault()
                  setEditing(true)
                  setEditingIndex(-1) // Not a custom tool index
                  setEditingTool({
                    name: label,
                    iconKey: override?.iconKey || key,
                    prompt: override?.prompt || `{{selection}}`,
                    active: true, // Not used for default tools but keeps consistency
                    isDefaultOverride: true,
                    key: key,
                  })
                  setErrorMessage('')
                }}
              >
                <PencilIcon />
              </div>
              <div
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault()
                  if (override) {
                    const overrides = { ...config.selectionToolsOverrides }
                    delete overrides[key]
                    updateConfig({ selectionToolsOverrides: overrides })
                  } else {
                    const newSelectionTools = config.selectionTools.filter((k) => k !== key)
                    const newActiveSelectionTools = config.activeSelectionTools.filter((k) => k !== key)
                    updateConfig({
                      selectionTools: newSelectionTools,
                      activeSelectionTools: newActiveSelectionTools,
                    })
                  }
                }}
                title={override ? t('Reset to default') : t('Remove tool')}
              >
                <TrashIcon />
              </div>
            </div>
            {editing && editingTool.isDefaultOverride && editingTool.key === key ? (
              <div style={{ width: '100%', marginTop: '10px' }}>{editingComponent}</div>
            ) : null}
          </label>
        )
      })}
      {
        config.customSelectionTools.map((tool, index) =>
          tool.name &&
          (editing && editingIndex === index ? (
            editingComponent
          ) : (
            <label key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={tool.active}
                onChange={(e) => {
                  const customSelectionTools = [...config.customSelectionTools]
                  customSelectionTools[index] = { ...tool, active: e.target.checked }
                  updateConfig({ customSelectionTools })
                }}
              />
              {tool.name}
              <div style={{ flexGrow: 1 }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault()
                    setEditing(true)
                    setEditingTool(tool)
                    setEditingIndex(index)
                    setErrorMessage('')
                  }}
                >
                  <PencilIcon />
                </div>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault()
                    const customSelectionTools = [...config.customSelectionTools]
                    customSelectionTools.splice(index, 1)
                    updateConfig({ customSelectionTools })
                  }}
                >
                  <TrashIcon />
                </div>
              </div>
            </label>
          )),
        )
      }
      <div style={{ height: '30px' }} />
      {
        editing && !editingTool.isDefaultOverride && editingIndex === -1 ? (
          editingComponent
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault()
              setEditing(true)
              setEditingTool(defaultTool)
              setEditingIndex(-1)
              setErrorMessage('')
            }}
          >
            {t('New')}
          </button>
        )
      }
    </>
  )
}
